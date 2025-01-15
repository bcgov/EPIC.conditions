export interface CreateAmendmentModel {
  amended_document_id?: string | null;
  amendment_name: string | null;
  amendment_link: string | null;
  date_issued?: string | null;
  is_latest_amendment_added?: boolean | null;
}
