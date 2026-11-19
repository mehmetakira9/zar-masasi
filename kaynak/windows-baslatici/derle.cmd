@echo off
rem Windows'ta yerlesik .NET Framework derleyicisiyle "Zar Masasi.exe" olusturur.
set CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC%" set CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe
"%CSC%" /nologo /target:winexe /win32icon:icon.ico /out:"Zar Masasi.exe" /r:System.Windows.Forms.dll ZarMasasi.cs
if errorlevel 1 (echo Derleme basarisiz. & pause & exit /b 1)
if not exist uygulama mkdir uygulama
xcopy /e /i /y ..\..\uygulama uygulama >nul
echo Tamam: "Zar Masasi.exe" olusturuldu.
pause
