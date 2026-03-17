#!/bin/bash

# Project N.O.M.A.D. Update Script

###################################################################################################################################################################################################

# Script                | Project N.O.M.A.D. Update Script
# Version               | 2.0.0
# Author                | Crosstalk Solutions, LLC
# Website               | https://crosstalksolutions.com

###################################################################################################################################################################################################
#                                                                                                                                                                                                 #
#                                                                                           Color Codes                                                                                           #
#                                                                                                                                                                                                 #
###################################################################################################################################################################################################

RESET='\033[0m'
YELLOW='\033[1;33m'
WHITE_R='\033[39m' # Same as GRAY_R for terminals with white background.
GRAY_R='\033[39m'
RED='\033[1;31m' # Light Red.
GREEN='\033[1;32m' # Light Green.

###################################################################################################################################################################################################
#                                                                                                                                                                                                 #
#                                                                                  Constants & Variables                                                                                          #
#                                                                                                                                                                                                 #
###################################################################################################################################################################################################

PLATFORM=""
NOMAD_DIR=""
local_ip_address=''

###################################################################################################################################################################################################
#                                                                                                                                                                                                 #
#                                                                                           Functions                                                                                             #
#                                                                                                                                                                                                 #
###################################################################################################################################################################################################

header_red() {
  echo -e "${RED}#########################################################################${RESET}\\n"
}

detect_platform() {
  local uname_s
  uname_s=$(uname -s)

  case "$uname_s" in
    Linux)
      PLATFORM="linux"
      NOMAD_DIR="/opt/project-nomad"
      ;;
    Darwin)
      PLATFORM="darwin"
      NOMAD_DIR="$HOME/.nomad"
      ;;
    *)
      header_red
      echo -e "${RED}#${RESET} Unsupported platform: ${uname_s}"
      exit 1
      ;;
  esac
}

check_has_sudo() {
  if [[ "$PLATFORM" == "darwin" ]]; then
    return 0
  fi

  if sudo -n true 2>/dev/null; then
    echo -e "${GREEN}#${RESET} User has sudo permissions.\\n"
  else
    header_red
    echo -e "${RED}#${RESET} This script requires sudo permissions to run. Please run the script with sudo.\\n"
    echo -e "${RED}#${RESET} For example: sudo bash $(basename "$0")"
    exit 1
  fi
}

check_is_bash() {
  if [[ -z "$BASH_VERSION" ]]; then
    header_red
    echo -e "${RED}#${RESET} This script requires bash to run. Please run the script using bash.\\n"
    echo -e "${RED}#${RESET} For example: bash $(basename "$0")"
    exit 1
  fi
    echo -e "${GREEN}#${RESET} This script is running in bash.\\n"
}

get_update_confirmation(){
  read -p "This script will update Project N.O.M.A.D. and its dependencies on your machine. No data loss is expected, but you should always back up your data before proceeding. Are you sure you want to continue? (y/n): " choice
  case "$choice" in
    y|Y )
      echo -e "${GREEN}#${RESET} User chose to continue with the update."
      ;;
    n|N )
      echo -e "${RED}#${RESET} User chose not to continue with the update."
      exit 0
      ;;
    * )
      echo "Invalid Response"
      echo "User chose not to continue with the update."
      exit 0
      ;;
  esac
}

ensure_docker_installed_and_running() {
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}#${RESET} Docker is not installed. Did you mean to use the install script instead of the update script?"
    exit 1
  fi

  if [[ "$PLATFORM" == "darwin" ]]; then
    if ! docker info &> /dev/null; then
      echo -e "${RED}#${RESET} Docker is not running. Please start Docker Desktop and try again."
      exit 1
    fi
  else
    if ! systemctl is-active --quiet docker; then
      echo -e "${RED}#${RESET} Docker is not running. Attempting to start Docker..."
      sudo systemctl start docker
      if ! systemctl is-active --quiet docker; then
        echo -e "${RED}#${RESET} Failed to start Docker. Please start Docker and try again."
        exit 1
      fi
    fi
  fi
}

ensure_docker_compose_file_exists() {
  if [ ! -f "${NOMAD_DIR}/compose.yml" ]; then
    echo -e "${RED}#${RESET} compose.yml file not found. Please ensure it exists at ${NOMAD_DIR}/compose.yml."
    exit 1
  fi
}

force_recreate() {
  local compose_cmd="docker compose -p project-nomad --env-file ${NOMAD_DIR}/.env -f ${NOMAD_DIR}/compose.yml"

  echo -e "${YELLOW}#${RESET} Pulling the latest Docker images..."
  if [[ "$PLATFORM" == "linux" ]]; then
    if ! sudo ${compose_cmd} --profile linux pull; then
      echo -e "${RED}#${RESET} Failed to pull the latest Docker images. Please check your network connection and try again."
      exit 1
    fi
  else
    if ! ${compose_cmd} pull; then
      echo -e "${RED}#${RESET} Failed to pull the latest Docker images. Please check your network connection and try again."
      exit 1
    fi
  fi

  echo -e "${YELLOW}#${RESET} Forcing recreation of containers..."
  if [[ "$PLATFORM" == "linux" ]]; then
    if ! sudo ${compose_cmd} --profile linux up -d --force-recreate; then
      echo -e "${RED}#${RESET} Failed to recreate containers. Please check the Docker logs for more details."
      exit 1
    fi
  else
    if ! ${compose_cmd} up -d --force-recreate; then
      echo -e "${RED}#${RESET} Failed to recreate containers. Please check the Docker logs for more details."
      exit 1
    fi
  fi
}

get_local_ip() {
  if [[ "$PLATFORM" == "darwin" ]]; then
    local_ip_address=$(ipconfig getifaddr en0 2>/dev/null)
    if [[ -z "$local_ip_address" ]]; then
      local_ip_address=$(ipconfig getifaddr en1 2>/dev/null)
    fi
  else
    local_ip_address=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi

  if [[ -z "$local_ip_address" ]]; then
    local_ip_address="127.0.0.1"
  fi
}

success_message() {
  echo -e "${GREEN}#${RESET} Project N.O.M.A.D update completed successfully!\\n"
  echo -e "${GREEN}#${RESET} Installation files are located at ${NOMAD_DIR}\\n\\n"
  echo -e "${GREEN}#${RESET} You can access the management interface at http://localhost:8080 or http://${local_ip_address}:8080\\n"
  echo -e "${GREEN}#${RESET} Thank you for supporting Project N.O.M.A.D!\\n"
}

###################################################################################################################################################################################################
#                                                                                                                                                                                                 #
#                                                                                           Main Script                                                                                           #
#                                                                                                                                                                                                 #
###################################################################################################################################################################################################

# Pre-flight checks
detect_platform
check_is_bash
check_has_sudo

# Main update
get_update_confirmation
ensure_docker_installed_and_running
ensure_docker_compose_file_exists
force_recreate
get_local_ip
success_message
