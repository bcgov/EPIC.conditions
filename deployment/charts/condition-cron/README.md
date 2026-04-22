# condition-cron Helm chart

Deploys the `condition-cron` worker.

## Lint

```bash
helm lint deployment/charts/condition-cron
```

## Render templates

```bash
helm template condition-cron deployment/charts/condition-cron
```

## Install

```bash
helm install condition-cron deployment/charts/condition-cron \
  --namespace <namespace> \
  --set imageTag=<tag> \
  --set s3.bucket=<bucket> \
  --set s3.host=<host> \
  --set extractor.apiUrl=<extractor-url> \
  --set secrets.s3AccessKeyId=<access-key> \
  --set secrets.s3SecretAccessKey=<secret-key> \
  --set secrets.extractorApiKey=<api-key>
```

## Upgrade

```bash
helm upgrade condition-cron deployment/charts/condition-cron \
  --namespace <namespace> \
  --reuse-values \
  --set imageTag=<tag>
```

Database credentials are read from the `condition-patroni` secret by default.
