# Use the official Node.js 23 Alpine image
FROM node:23-alpine

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

# Ensure 'python' command is available (symlink to python3)
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .


# Set up Python virtual environment and install requirements
# This Python is for the seedStockPrice script to run
RUN python3 -m venv /opt/venv \
    && . /opt/venv/bin/activate \
    && pip install --no-cache-dir -r ./src/utils/seedStockPrice/requirements.txt

# Ensure the venv's python and pip are used by default
ENV PATH="/opt/venv/bin:$PATH"

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["yarn", "start"]
