# condition-cron build config Helm chart

Creates the OpenShift image stream and build config for `condition-cron`.

## Lint

```bash
helm lint deployment/charts/condition-cron-bc
```

## Render templates

```bash
helm template condition-cron-bc deployment/charts/condition-cron-bc
```

## Install

```bash
helm install condition-cron-bc deployment/charts/condition-cron-bc \
  --namespace <tools-namespace>
```

## Upgrade

```bash
helm upgrade condition-cron-bc deployment/charts/condition-cron-bc \
  --namespace <tools-namespace>
```
