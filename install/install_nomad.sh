#!/bin/bash

# Project N.O.M.A.D. Installation Script

###################################################################################################################################################################################################

# Script                | Project N.O.M.A.D. Installation Script
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

WHIPTAIL_TITLE="Project N.O.M.A.D Installation"
MANAGEMENT_COMPOSE_FILE_URL="https://raw.githubusercontent.com/Crosstalk-Solutions/project-nomad/refs/heads/main/install/management_compose.yaml"
ENTRYPOINT_SCRIPT_URL="https://raw.githubusercontent.com/Crosstalk-Solutions/project-nomad/refs/heads/main/install/entrypoint.sh"
SIDECAR_UPDATER_DOCKERFILE_URL="https://raw.githubusercontent.com/Crosstalk-Solutions/project-nomad/refs/heads/main/install/sidecar-updater/Dockerfile"
SIDECAR_UPDATER_SCRIPT_URL="https://raw.githubusercontent.com/Crosstalk-Solutions/project-nomad/refs/heads/main/install/sidecar-updater/update-watcher.sh"
START_SCRIPT_URL="https://raw.githubusercontent.com/Crosstalk-Solutions/project-nomad/refs/heads/main/install/start_nomad.sh"
STOP_SCRIPT_URL="https://raw.githubusercontent.com/Crosstalk-Solutions/project-nomad/refs/heads/main/install/stop_nomad.sh"
UPDATE_SCRIPT_URL="https://raw.githubusercontent.com/Crosstalk-Solutions/project-nomad/refs/heads/main/install/update_nomad.sh"
WAIT_FOR_IT_SCRIPT_URL="https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh"

# Platform detection — set early, used throughout
PLATFORM=""   # "linux" or "darwin"
NOMAD_DIR=""  # Set by detect_platform

script_option_debug='true'
accepted_terms='false'
local_ip_address=''

###################################################################################################################################################################################################
#                                                                                                                                                                                                 #
#                                                                                           Functions                                                                                             #
#                                                                                                                                                                                                 #
###################################################################################################################################################################################################

header() {
  if [[ "${script_option_debug}" != 'true' ]]; then clear; clear; fi
  echo -e "${GREEN}#########################################################################${RESET}\\n"
}

header_red() {
  if [[ "${script_option_debug}" != 'true' ]]; then clear; clear; fi
  echo -e "${RED}#########################################################################${RESET}\\n"
}

detect_platform() {
  local uname_s
  uname_s=$(uname -s)

  case "$uname_s" in
    Linux)
      PLATFORM="linux"
      NOMAD_DIR="/opt/project-nomad"
      echo -e "${GREEN}#${RESET} Detected platform: Linux\\n"
      ;;
    Darwin)
      PLATFORM="darwin"
      NOMAD_DIR="$HOME/.nomad"
      echo -e "${GREEN}#${RESET} Detected platform: macOS\\n"
      ;;
    *)
      header_red
      echo -e "${RED}#${RESET} Unsupported platform: ${uname_s}\\n"
      echo -e "${RED}#${RESET} This script supports Linux and macOS."
      exit 1
      ;;
  esac
}

check_has_sudo() {
  # macOS with Docker Desktop does not need sudo
  if [[ "$PLATFORM" == "darwin" ]]; then
    echo -e "${GREEN}#${RESET} macOS detected — sudo not required for Docker Desktop.\\n"
    return 0
  fi

  if sudo -n true 2>/dev/null; then
    echo -e "${GREEN}#${RESET} User has sudo permissions.\\n"
  else
    echo "User does not have sudo permissions"
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

ensure_dependencies_installed() {
  local missing_deps=()

  if ! command -v curl &> /dev/null; then
    missing_deps+=("curl")
  fi

  if ! command -v docker &> /dev/null; then
    missing_deps+=("docker")
  fi

  if [[ ${#missing_deps[@]} -eq 0 ]]; then
    echo -e "${GREEN}#${RESET} All required dependencies are already installed.\\n"
    return 0
  fi

  if [[ "$PLATFORM" == "darwin" ]]; then
    # On macOS we cannot auto-install — tell the user what's missing
    echo -e "${RED}#${RESET} Missing dependencies: ${missing_deps[*]}\\n"
    if [[ " ${missing_deps[*]} " == *" docker "* ]]; then
      echo -e "${RED}#${RESET} Please install Docker Desktop for Mac from https://www.docker.com/products/docker-desktop/ and try again."
    fi
    if [[ " ${missing_deps[*]} " == *" curl "* ]]; then
      echo -e "${RED}#${RESET} Please install curl (e.g. via Homebrew: brew install curl) and try again."
    fi
    exit 1
  fi

  # Linux — auto-install via apt-get (curl only; Docker installed separately)
  local apt_deps=()
  for dep in "${missing_deps[@]}"; do
    if [[ "$dep" != "docker" ]]; then
      apt_deps+=("$dep")
    fi
  done

  if [[ ${#apt_deps[@]} -gt 0 ]]; then
    echo -e "${YELLOW}#${RESET} Installing required dependencies: ${apt_deps[*]}...\\n"
    sudo apt-get update
    sudo apt-get install -y "${apt_deps[@]}"

    for dep in "${apt_deps[@]}"; do
      if ! command -v "$dep" &> /dev/null; then
        echo -e "${RED}#${RESET} Failed to install $dep. Please install it manually and try again."
        exit 1
      fi
    done
    echo -e "${GREEN}#${RESET} Dependencies installed successfully.\\n"
  fi
}

check_is_debug_mode(){
  if [[ "${script_option_debug}" == 'true' ]]; then
    echo -e "${YELLOW}#${RESET} Debug mode is enabled, the script will not clear the screen...\\n"
  else
    clear; clear
  fi
}

generateRandomPass() {
  local length="${1:-32}"  # Default to 32
  local password

  # Generate random password using /dev/urandom (works on Linux and macOS)
  password=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "$length")

  echo "$password"
}

ensure_docker_installed() {
  if [[ "$PLATFORM" == "darwin" ]]; then
    # macOS — Docker Desktop must already be installed
    if ! command -v docker &> /dev/null; then
      echo -e "${RED}#${RESET} Docker not found. Please install Docker Desktop for Mac from:"
      echo -e "${RED}#${RESET} https://www.docker.com/products/docker-desktop/"
      exit 1
    fi

    # Verify Docker daemon is running
    if ! docker info &> /dev/null; then
      echo -e "${RED}#${RESET} Docker is installed but not running. Please start Docker Desktop and try again."
      exit 1
    fi

    echo -e "${GREEN}#${RESET} Docker Desktop is installed and running.\\n"
    return 0
  fi

  # Linux — install via convenience script if missing
  if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}#${RESET} Docker not found. Installing Docker...\\n"

    sudo apt-get update
    sudo apt-get install -y ca-certificates curl

    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh

    if ! command -v docker &> /dev/null; then
      echo -e "${RED}#${RESET} Docker installation failed. Please check the logs and try again."
      exit 1
    fi

    echo -e "${GREEN}#${RESET} Docker installation completed.\\n"
  else
    echo -e "${GREEN}#${RESET} Docker is already installed.\\n"

    # Check if Docker service is running
    if ! systemctl is-active --quiet docker; then
      echo -e "${YELLOW}#${RESET} Docker is installed but not running. Attempting to start Docker...\\n"
      sudo systemctl start docker
      if ! systemctl is-active --quiet docker; then
        echo -e "${RED}#${RESET} Failed to start Docker. Please check the Docker service status and try again."
        exit 1
      else
        echo -e "${GREEN}#${RESET} Docker service started successfully.\\n"
      fi
    else
      echo -e "${GREEN}#${RESET} Docker service is already running.\\n"
    fi
  fi
}

setup_nvidia_container_toolkit() {
  # Skip entirely on macOS — no GPU passthrough support
  if [[ "$PLATFORM" == "darwin" ]]; then
    echo -e "${YELLOW}#${RESET} GPU passthrough is not available on macOS. Skipping GPU setup.\\n"
    return 0
  fi

  # This function attempts to set up NVIDIA GPU support but is non-blocking
  # Any failures will result in warnings but will NOT stop the installation process

  echo -e "${YELLOW}#${RESET} Checking for NVIDIA GPU...\\n"

  local has_nvidia_gpu=false
  if command -v lspci &> /dev/null; then
    if lspci 2>/dev/null | grep -i nvidia &> /dev/null; then
      has_nvidia_gpu=true
      echo -e "${GREEN}#${RESET} NVIDIA GPU detected.\\n"
    fi
  fi

  if ! $has_nvidia_gpu && command -v nvidia-smi &> /dev/null; then
    if nvidia-smi &> /dev/null; then
      has_nvidia_gpu=true
      echo -e "${GREEN}#${RESET} NVIDIA GPU detected via nvidia-smi.\\n"
    fi
  fi

  if ! $has_nvidia_gpu; then
    echo -e "${YELLOW}#${RESET} No NVIDIA GPU detected. Skipping NVIDIA container toolkit installation.\\n"
    return 0
  fi

  if command -v nvidia-ctk &> /dev/null; then
    echo -e "${GREEN}#${RESET} NVIDIA container toolkit is already installed.\\n"
    return 0
  fi

  echo -e "${YELLOW}#${RESET} Installing NVIDIA container toolkit...\\n"

  if ! curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey 2>/dev/null | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg 2>/dev/null; then
    echo -e "${YELLOW}#${RESET} Warning: Failed to add NVIDIA container toolkit GPG key. Continuing anyway...\\n"
    return 0
  fi

  if ! curl -fsSL https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list 2>/dev/null \
      | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
      | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list > /dev/null 2>&1; then
    echo -e "${YELLOW}#${RESET} Warning: Failed to add NVIDIA container toolkit repository. Continuing anyway...\\n"
    return 0
  fi

  if ! sudo apt-get update 2>/dev/null; then
    echo -e "${YELLOW}#${RESET} Warning: Failed to update package list. Continuing anyway...\\n"
    return 0
  fi

  if ! sudo apt-get install -y nvidia-container-toolkit 2>/dev/null; then
    echo -e "${YELLOW}#${RESET} Warning: Failed to install NVIDIA container toolkit. Continuing anyway...\\n"
    return 0
  fi

  echo -e "${GREEN}#${RESET} NVIDIA container toolkit installed successfully.\\n"

  echo -e "${YELLOW}#${RESET} Configuring Docker to use NVIDIA runtime...\\n"

  if ! sudo nvidia-ctk runtime configure --runtime=docker 2>/dev/null; then
    echo -e "${YELLOW}#${RESET} nvidia-ctk configure failed, attempting manual configuration...\\n"

    local daemon_json="/etc/docker/daemon.json"
    local config_success=false

    if [[ -f "$daemon_json" ]]; then
      sudo cp "$daemon_json" "${daemon_json}.backup" 2>/dev/null || true

      if ! grep -q '"nvidia"' "$daemon_json" 2>/dev/null; then
        if command -v jq &> /dev/null; then
          if sudo jq '. + {"runtimes": {"nvidia": {"path": "nvidia-container-runtime", "runtimeArgs": []}}}' "$daemon_json" > /tmp/daemon.json.tmp 2>/dev/null; then
            if sudo mv /tmp/daemon.json.tmp "$daemon_json" 2>/dev/null; then
              config_success=true
            fi
          fi
          sudo rm -f /tmp/daemon.json.tmp 2>/dev/null || true
        else
          echo -e "${YELLOW}#${RESET} jq not available, skipping manual daemon.json configuration...\\n"
        fi
      else
        config_success=true
      fi
    else
      if echo '{"runtimes":{"nvidia":{"path":"nvidia-container-runtime","runtimeArgs":[]}}}' | sudo tee "$daemon_json" > /dev/null 2>&1; then
        config_success=true
      fi
    fi

    if ! $config_success; then
      echo -e "${YELLOW}#${RESET} Manual daemon.json configuration unsuccessful. GPU support may require manual setup.\\n"
    fi
  fi

  echo -e "${YELLOW}#${RESET} Restarting Docker service...\\n"
  if ! sudo systemctl restart docker 2>/dev/null; then
    echo -e "${YELLOW}#${RESET} Warning: Failed to restart Docker service. You may need to restart it manually.\\n"
    return 0
  fi

  echo -e "${YELLOW}#${RESET} Verifying NVIDIA runtime configuration...\\n"
  sleep 2

  if docker info 2>/dev/null | grep -q "nvidia"; then
    echo -e "${GREEN}#${RESET} NVIDIA runtime successfully configured and verified.\\n"
  else
    echo -e "${YELLOW}#${RESET} Warning: NVIDIA runtime not detected in Docker info. GPU acceleration may not work.\\n"
    echo -e "${YELLOW}#${RESET} You may need to manually configure /etc/docker/daemon.json and restart Docker.\\n"
  fi

  echo -e "${GREEN}#${RESET} NVIDIA container toolkit configuration completed.\\n"
}

get_install_confirmation(){
  read -p "This script will install/update Project N.O.M.A.D. and its dependencies on your machine. Are you sure you want to continue? (y/N): " choice
  case "$choice" in
    y|Y )
      echo -e "${GREEN}#${RESET} User chose to continue with the installation."
      ;;
    * )
      echo "User chose not to continue with the installation."
      exit 0
      ;;
  esac
}

accept_terms() {
  printf "\n\n"
  echo "License Agreement & Terms of Use"
  echo "__________________________"
  printf "\n\n"
  echo "Project N.O.M.A.D. is licensed under the Apache License 2.0. The full license can be found at https://www.apache.org/licenses/LICENSE-2.0 or in the LICENSE file of this repository."
  printf "\n"
  echo "By accepting this agreement, you acknowledge that you have read and understood the terms and conditions of the Apache License 2.0 and agree to be bound by them while using Project N.O.M.A.D."
  echo -e "\n\n"
  read -p "I have read and accept License Agreement & Terms of Use (y/N)? " choice
  case "$choice" in
    y|Y )
      accepted_terms='true'
      ;;
    * )
      echo "License Agreement & Terms of Use not accepted. Installation cannot continue."
      exit 1
      ;;
  esac
}

create_nomad_directory(){
  if [[ ! -d "$NOMAD_DIR" ]]; then
    echo -e "${YELLOW}#${RESET} Creating directory for Project N.O.M.A.D at $NOMAD_DIR...\\n"
    if [[ "$PLATFORM" == "darwin" ]]; then
      mkdir -p "$NOMAD_DIR"
    else
      sudo mkdir -p "$NOMAD_DIR"
      sudo chown "$(whoami):$(whoami)" "$NOMAD_DIR"
    fi
    echo -e "${GREEN}#${RESET} Directory created successfully.\\n"
  else
    echo -e "${GREEN}#${RESET} Directory $NOMAD_DIR already exists.\\n"
  fi

  # Ensure storage/logs subdirectory exists
  if [[ "$PLATFORM" == "darwin" ]]; then
    mkdir -p "${NOMAD_DIR}/storage/logs"
    touch "${NOMAD_DIR}/storage/logs/admin.log"
  else
    sudo mkdir -p "${NOMAD_DIR}/storage/logs"
    sudo touch "${NOMAD_DIR}/storage/logs/admin.log"
  fi
}

download_management_compose_file() {
  local compose_file_path="${NOMAD_DIR}/compose.yml"

  echo -e "${YELLOW}#${RESET} Downloading docker-compose file for management...\\n"
  if ! curl -fsSL "$MANAGEMENT_COMPOSE_FILE_URL" -o "$compose_file_path"; then
    echo -e "${RED}#${RESET} Failed to download the docker compose file. Please check the URL and try again."
    exit 1
  fi
  echo -e "${GREEN}#${RESET} Docker compose file downloaded successfully to $compose_file_path.\\n"
}

generate_env_file() {
  local env_file_path="${NOMAD_DIR}/.env"

  echo -e "${YELLOW}#${RESET} Generating environment configuration...\\n"

  local app_key
  local db_root_password
  local db_user_password
  local redis_password
  app_key=$(generateRandomPass)
  db_root_password=$(generateRandomPass)
  db_user_password=$(generateRandomPass)
  redis_password=$(generateRandomPass)

  cat > "$env_file_path" <<EOF
# Project NOMAD Configuration
# Generated by the installer. Do not commit this file.

NOMAD_ROOT=${NOMAD_DIR}
NOMAD_IP=${local_ip_address}
APP_KEY=${app_key}
DB_ROOT_PASSWORD=${db_root_password}
DB_USER_PASSWORD=${db_user_password}
REDIS_PASSWORD=${redis_password}
EOF

  # Protect the env file
  chmod 600 "$env_file_path"

  echo -e "${GREEN}#${RESET} Environment configuration generated at $env_file_path.\\n"
}

download_wait_for_it_script() {
  local wait_for_it_script_path="${NOMAD_DIR}/wait-for-it.sh"

  echo -e "${YELLOW}#${RESET} Downloading wait-for-it script...\\n"
  if ! curl -fsSL "$WAIT_FOR_IT_SCRIPT_URL" -o "$wait_for_it_script_path"; then
    echo -e "${RED}#${RESET} Failed to download the wait-for-it script. Please check the URL and try again."
    exit 1
  fi
  chmod +x "$wait_for_it_script_path"
  echo -e "${GREEN}#${RESET} wait-for-it script downloaded successfully to $wait_for_it_script_path.\\n"
}

download_entrypoint_script() {
  local entrypoint_script_path="${NOMAD_DIR}/entrypoint.sh"

  echo -e "${YELLOW}#${RESET} Downloading entrypoint script...\\n"
  if ! curl -fsSL "$ENTRYPOINT_SCRIPT_URL" -o "$entrypoint_script_path"; then
    echo -e "${RED}#${RESET} Failed to download the entrypoint script. Please check the URL and try again."
    exit 1
  fi
  chmod +x "$entrypoint_script_path"
  echo -e "${GREEN}#${RESET} entrypoint script downloaded successfully to $entrypoint_script_path.\\n"
}

download_sidecar_files() {
  if [[ ! -d "${NOMAD_DIR}/sidecar-updater" ]]; then
    if [[ "$PLATFORM" == "darwin" ]]; then
      mkdir -p "${NOMAD_DIR}/sidecar-updater"
    else
      sudo mkdir -p "${NOMAD_DIR}/sidecar-updater"
      sudo chown "$(whoami):$(whoami)" "${NOMAD_DIR}/sidecar-updater"
    fi
  fi

  local sidecar_dockerfile_path="${NOMAD_DIR}/sidecar-updater/Dockerfile"
  local sidecar_script_path="${NOMAD_DIR}/sidecar-updater/update-watcher.sh"

  echo -e "${YELLOW}#${RESET} Downloading sidecar updater Dockerfile...\\n"
  if ! curl -fsSL "$SIDECAR_UPDATER_DOCKERFILE_URL" -o "$sidecar_dockerfile_path"; then
    echo -e "${RED}#${RESET} Failed to download the sidecar updater Dockerfile. Please check the URL and try again."
    exit 1
  fi
  echo -e "${GREEN}#${RESET} Sidecar updater Dockerfile downloaded successfully to $sidecar_dockerfile_path.\\n"

  echo -e "${YELLOW}#${RESET} Downloading sidecar updater script...\\n"
  if ! curl -fsSL "$SIDECAR_UPDATER_SCRIPT_URL" -o "$sidecar_script_path"; then
    echo -e "${RED}#${RESET} Failed to download the sidecar updater script. Please check the URL and try again."
    exit 1
  fi
  chmod +x "$sidecar_script_path"
  echo -e "${GREEN}#${RESET} Sidecar updater script downloaded successfully to $sidecar_script_path.\\n"
}

download_helper_scripts() {
  local start_script_path="${NOMAD_DIR}/start_nomad.sh"
  local stop_script_path="${NOMAD_DIR}/stop_nomad.sh"
  local update_script_path="${NOMAD_DIR}/update_nomad.sh"

  echo -e "${YELLOW}#${RESET} Downloading helper scripts...\\n"
  if ! curl -fsSL "$START_SCRIPT_URL" -o "$start_script_path"; then
    echo -e "${RED}#${RESET} Failed to download the start script. Please check the URL and try again."
    exit 1
  fi
  chmod +x "$start_script_path"

  if ! curl -fsSL "$STOP_SCRIPT_URL" -o "$stop_script_path"; then
    echo -e "${RED}#${RESET} Failed to download the stop script. Please check the URL and try again."
    exit 1
  fi
  chmod +x "$stop_script_path"

  if ! curl -fsSL "$UPDATE_SCRIPT_URL" -o "$update_script_path"; then
    echo -e "${RED}#${RESET} Failed to download the update script. Please check the URL and try again."
    exit 1
  fi
  chmod +x "$update_script_path"

  echo -e "${GREEN}#${RESET} Helper scripts downloaded successfully to $start_script_path, $stop_script_path, and $update_script_path.\\n"
}

start_management_containers() {
  echo -e "${YELLOW}#${RESET} Starting management containers using docker compose...\\n"

  local compose_cmd="docker compose -p project-nomad --env-file ${NOMAD_DIR}/.env -f ${NOMAD_DIR}/compose.yml"

  # On Linux, include the linux profile for the disk-collector sidecar
  if [[ "$PLATFORM" == "linux" ]]; then
    compose_cmd="sudo ${compose_cmd} --profile linux up -d"
  else
    compose_cmd="${compose_cmd} up -d"
  fi

  if ! eval "$compose_cmd"; then
    echo -e "${RED}#${RESET} Failed to start management containers. Please check the logs and try again."
    exit 1
  fi
  echo -e "${GREEN}#${RESET} Management containers started successfully.\\n"
}

get_local_ip() {
  if [[ "$PLATFORM" == "darwin" ]]; then
    # macOS — try en0 (Wi-Fi) first, then en1
    local_ip_address=$(ipconfig getifaddr en0 2>/dev/null)
    if [[ -z "$local_ip_address" ]]; then
      local_ip_address=$(ipconfig getifaddr en1 2>/dev/null)
    fi
  else
    # Linux
    local_ip_address=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi

  if [[ -z "$local_ip_address" ]]; then
    echo -e "${YELLOW}#${RESET} Unable to determine local IP address. Using 127.0.0.1 as fallback.\\n"
    local_ip_address="127.0.0.1"
  fi
}

verify_gpu_setup() {
  # Skip on macOS — no GPU passthrough
  if [[ "$PLATFORM" == "darwin" ]]; then
    echo -e "${YELLOW}#${RESET} GPU passthrough is not available on macOS. The AI Assistant will run in CPU-only mode.\\n"
    return 0
  fi

  echo -e "\\n${YELLOW}#${RESET} GPU Setup Verification\\n"
  echo -e "${YELLOW}===========================================${RESET}\\n"

  if command -v nvidia-smi &> /dev/null; then
    echo -e "${GREEN}+${RESET} NVIDIA GPU detected:"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null | while read -r line; do
      echo -e "  ${WHITE_R}$line${RESET}"
    done
    echo ""
  else
    echo -e "${YELLOW}o${RESET} No NVIDIA GPU detected (nvidia-smi not available)\\n"
  fi

  if command -v nvidia-ctk &> /dev/null; then
    echo -e "${GREEN}+${RESET} NVIDIA Container Toolkit installed: $(nvidia-ctk --version 2>/dev/null | head -n1)\\n"
  else
    echo -e "${YELLOW}o${RESET} NVIDIA Container Toolkit not installed\\n"
  fi

  if docker info 2>/dev/null | grep -q "nvidia"; then
    echo -e "${GREEN}+${RESET} Docker NVIDIA runtime configured\\n"
  else
    echo -e "${YELLOW}o${RESET} Docker NVIDIA runtime not detected\\n"
  fi

  if command -v lspci &> /dev/null; then
    if lspci 2>/dev/null | grep -iE "amd|radeon" &> /dev/null; then
      echo -e "${YELLOW}o${RESET} AMD GPU detected (ROCm support not currently available)\\n"
    fi
  fi

  echo -e "${YELLOW}===========================================${RESET}\\n"

  if command -v nvidia-smi &> /dev/null && docker info 2>/dev/null | grep -q "nvidia"; then
    echo -e "${GREEN}#${RESET} GPU acceleration is properly configured! The AI Assistant will use your GPU.\\n"
  else
    echo -e "${YELLOW}#${RESET} GPU acceleration not detected. The AI Assistant will run in CPU-only mode.\\n"
    if command -v nvidia-smi &> /dev/null && ! docker info 2>/dev/null | grep -q "nvidia"; then
      echo -e "${YELLOW}#${RESET} Tip: Your GPU is detected but Docker runtime is not configured.\\n"
      echo -e "${YELLOW}#${RESET} Try restarting Docker: ${WHITE_R}sudo systemctl restart docker${RESET}\\n"
    fi
  fi
}

success_message() {
  echo -e "${GREEN}#${RESET} Project N.O.M.A.D installation completed successfully!\\n"
  echo -e "${GREEN}#${RESET} Installation files are located at ${NOMAD_DIR}\\n\\n"
  if [[ "$PLATFORM" == "linux" ]]; then
    echo -e "${GREEN}#${RESET} Project N.O.M.A.D's Command Center should automatically start whenever your device reboots. However, if you need to start it manually, you can always do so by running: ${WHITE_R}${NOMAD_DIR}/start_nomad.sh${RESET}\\n"
  else
    echo -e "${GREEN}#${RESET} To start Project N.O.M.A.D manually, run: ${WHITE_R}${NOMAD_DIR}/start_nomad.sh${RESET}\\n"
    echo -e "${GREEN}#${RESET} Note: Ensure Docker Desktop is running before starting.\\n"
  fi
  echo -e "${GREEN}#${RESET} You can now access the management interface at http://localhost:8080 or http://${local_ip_address}:8080\\n"
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
ensure_dependencies_installed
check_is_debug_mode

# Main install
get_install_confirmation
accept_terms
ensure_docker_installed
setup_nvidia_container_toolkit
get_local_ip
create_nomad_directory
download_wait_for_it_script
download_entrypoint_script
download_sidecar_files
download_helper_scripts
download_management_compose_file
generate_env_file
start_management_containers
verify_gpu_setup
success_message
