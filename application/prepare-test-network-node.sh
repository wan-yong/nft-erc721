#!/bin/bash

# Set user
# $1 - sudo user

###############
# Run as the new user
# Update and install
###############

# Tools - common
sudo apt update; sudo apt install -y \
    software-properties-common dirmngr apt-transport-https build-essential jq

# Tools - Git
sudo add-apt-repository -y ppa:git-core/ppa
sudo apt update; sudo apt install -y git

# Check installation
if git version; then
  echo "git is installed"
else 
  echo  "**************Please git installation."
  exit 1 
fi

# Tools - docker
sudo apt update; sudo apt remove -y \
    docker docker-engine docker.io containerd runc

sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update; sudo apt -y \
    install docker-ce docker-ce-cli containerd.io

# Refresh the user's group to the docker group
newgrp docker

# Add to docker group after installation
sudo usermod -a -G docker $1

# Check installation
if docker version; then
  echo "docker is installed"
else 
  echo  "Please check docker installation."
  exit 1 
fi

sudo systemctl enable docker && sudo systemctl start docker

# Tools - docker compose
sudo curl -L https://github.com/docker/compose/releases/download/1.29.2/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Check installation
if docker-compose version; then
  echo "docker compose is installed"
else 
  echo  "**************Please check docker compose installation."
  exit 1 
fi

# Tools - Node.js v17.x using Ubuntu
curl -fsSL https://deb.nodesource.com/setup_17.x | sudo -E bash -
sudo apt update && sudo apt install -y nodejs

#----------------------China Only-------------------------------
# Node.js v17.x using Ubuntu
# curl -fsSL https://deb.nodesource.com/setup_17.x | sed 's/github.com/hub.fastgit.org/g' | sudo -E bash -
# sudo apt-get install -y nodejs
# ----------------------China Only-------------------------------

# Check installation
if node -v; then
  echo "Node.js is installed"
else 
  echo  "**************Please check Node.js installation."
  exit 1 
fi


# Tools - go
cd ~
wget https://go.dev/dl/go1.17.5.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf ~/go1.17.5.linux-amd64.tar.gz

# Append to usr profile for next login
if [ -e "$HOME/.profile" ]; then
  cat >> $HOME/.profile << EOF

# set PATH so it includes go bin if it exists
if [ -d "/usr/local/go/bin" ] ; then
    PATH="/usr/local/go/bin:\$PATH"
fi
EOF

  # for this login
  export PATH="/usr/local/go/bin:$PATH"

else
  echo  "Target file doesn't exist."
  exit 1
fi

# No need to use source here
# source $HOME/.profile

# Check installation
if go version; then
  echo "go binaray is installed"
else 
  echo  "**************Please check go binary installation."
  exit 1 
fi

# Download test-network binary
mkdir -p $HOME/go/src/github.com/wan-yong
cd $HOME/go/src/github.com/wan-yong

curl -sSL https://bit.ly/2ysbOFE | bash -s

#----------------------China Only-------------------------------
# wget https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh
# sed -i 's/github.com/hub.fastgit.org/g' ~/bootstrap.sh
# cat ~/bootstrap.sh 2.3.3 1.5.2 | sudo bash -s -
# ----------------------China Only-------------------------------