"""Task: read pending extraction requests from DB, extract conditions, and load into the database."""

import os
import logging

from condition_cron.services import db_service, extraction_service, s3_service

logger = logging.getLogger(__name__)


class ProcessDocuments:
    """Orchestrates the full pipeline for each pending extraction request."""

    @staticmethod
    def process():
        """Main entry point called by invoke_jobs.py."""
        pending = db_service.get_pending_requests()

        if not pending:
            logger.info('No pending extraction requests found.')
            return

        success, failed = 0, 0

        for req in pending:
            request_id = req['id']
            s3_key = req['s3_url']
            local_path = None

            try:
                logger.info('Processing extraction request %d — %s', request_id, s3_key)

                # 1. Mark as processing
                db_service.mark_processing(request_id)

                # 2. Download PDF from S3
                local_path = s3_service.download_file(s3_key)

                # 3. Extract and enrich conditions
                result = extraction_service.extract_and_enrich(local_path)

                # 4. Attach metadata from the extraction_requests row
                filename = os.path.basename(s3_key)
                result['project_id'] = req['project_id']
                result['document_id'] = req['document_id'] or os.path.splitext(filename)[0]
                result['project_name'] = req['project_name'] or req['project_id']
                result['project_type'] = req['project_type'] or ''
                result['display_name'] = req['document_label'] or filename
                result['document_file_name'] = req['document_file_name'] or filename
                result['document_type'] = req['document_type'] or result.get('classification', {}).get('document_type', '')
                result['date_issued'] = req['date_issued']
                result['act'] = req['act']

                # 5. Skip direct loading into database, instead save for human review
                # loader_service.load_extracted_data(result)

                # 6. Mark as completed and save JSON blob
                if db_service.get_request_status(request_id) == 'rejected':
                    logger.info('Skipping save for rejected extraction request %d', request_id)
                    continue

                db_service.save_extraction_result(request_id, result)

                success += 1
                logger.info('Successfully processed extraction request %d', request_id)

            except Exception as exc:
                failed += 1
                error_msg = str(exc)
                logger.error('Failed to process extraction request %d: %s', request_id, error_msg, exc_info=True)
                try:
                    db_service.mark_failed(request_id, error_msg)
                except Exception:
                    logger.error('Could not update status to failed for request %d', request_id)

            finally:
                if local_path and os.path.exists(local_path):
                    os.remove(local_path)

        logger.info('ProcessDocuments complete — success: %d, failed: %d', success, failed)
