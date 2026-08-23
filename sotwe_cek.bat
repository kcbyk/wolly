@echo off
chcp 65001 > nul
title Wolly Sotwe Video Cekici ve Deployer
echo ===================================================
echo     🎬 WOLLY OTOMATIK SOTWE CEKICI VE DEPLOYER
echo ===================================================
echo.
python scrape_cli.py
echo.
echo ===================================================
echo     Islem tamamlandi!
echo ===================================================
pause
