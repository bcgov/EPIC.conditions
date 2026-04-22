{{- define "condition-cron.labels" -}}
app: {{ .Values.name }}
app-group: condition-app
template: {{ .Values.name }}-deploy
{{- end -}}
