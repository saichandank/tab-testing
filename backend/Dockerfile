FROM python:3.11-slim

WORKDIR /backend

# Copy and install your dependencies

COPY requirements.txt .
RUN python -m venv virtualenv
RUN . virtualenv/bin/activate
RUN pip install --no-cache-dir -r requirements.txt

# Copy your backend code
COPY . .

EXPOSE 5000

CMD ["python", "app.py"]