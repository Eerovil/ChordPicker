FROM ubuntu:18.04

RUN sed -i 's|http://archive.ubuntu.com|ftp://mirrors.nic.funet.fi|g' /etc/apt/sources.list

RUN apt-get update && apt-get -y install \
        curl \
  && rm -rf /var/lib/apt/lists/*

RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -

RUN apt-get update && apt-get -y install \
        git \
        nodejs \
  && rm -rf /var/lib/apt/lists/*

RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
    && echo "$SNIPPET" >> "/root/.bashrc"
