@echo off
echo Setting up development environment...

echo Installing npm dependencies...
npm install

echo Starting LocalStack...
call scripts\start-localstack.bat

echo Development environment setup complete!
echo Run 'npm start' to launch the application.