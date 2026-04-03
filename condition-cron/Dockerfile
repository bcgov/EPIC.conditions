FROM python:3.10-buster

# ── Install go-crond ──────────────────────────────────────────────────────────
ARG SOURCE_REPO=BCDevOps
ARG GOCROND_VERSION=0.6.2
ARG VCS_REF="missing"
ARG BUILD_DATE="missing"

ENV VCS_REF=${VCS_REF}
ENV BUILD_DATE=${BUILD_DATE}

LABEL org.label-schema.vcs-ref=${VCS_REF} \
    org.label-schema.build-date=${BUILD_DATE}

RUN curl https://github.com/$SOURCE_REPO/go-crond/releases/download/$GOCROND_VERSION/go-crond-64-linux -s -L -o /usr/local/bin/go-crond
RUN chmod ug+x /usr/local/bin/go-crond

# ── App user ──────────────────────────────────────────────────────────────────
ARG uid=1001
ARG user=cron
RUN useradd -U -ms /bin/bash -u $uid $user \
    && usermod -a -G root $user

ENV HOME=/condition-cron
RUN mkdir $HOME && chmod 755 $HOME

WORKDIR $HOME

# ── Install dependencies ───────────────────────────────────────────────────────
COPY ./requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy condition-parser so its modules can be imported directly
COPY ../condition-parser /condition-parser
RUN pip install --no-cache-dir -r /condition-parser/requirements.txt

COPY . .

# condition-parser is imported directly — add it to PYTHONPATH alongside the cron src
ENV PYTHONPATH=/condition-cron/src:/condition-parser

# ── Permissions ───────────────────────────────────────────────────────────────
RUN chown -R $user:root $HOME \
    && chmod -R ug+rw $HOME \
    && chmod ug+x $HOME/*.sh \
    && chmod g+rw /etc/passwd \
    && chmod g-w $HOME/cron/crontab

USER $user
ENTRYPOINT ["bash", "docker-entrypoint.sh"]
