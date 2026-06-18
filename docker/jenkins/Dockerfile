FROM jenkins/jenkins:lts-jdk17

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm \
    && ARCH="$(dpkg --print-architecture)" \
    && curl -fsSLo /tmp/docker-ce-cli.deb \
      "https://download.docker.com/linux/debian/dists/trixie/pool/stable/${ARCH}/docker-ce-cli_29.5.3-1~debian.13~trixie_${ARCH}.deb" \
    && dpkg -i /tmp/docker-ce-cli.deb \
    && rm /tmp/docker-ce-cli.deb \
    && usermod -aG root jenkins \
    && rm -rf /var/lib/apt/lists/*

USER jenkins
