TaracotJS
=========

TaracotJS is fast and minimalist CMS based on Node.js. It has the following features:

 - MongoDB as a database storage and Redis for session storage - for maximum perfomance
 - Independent Module structure
 - Multilanguage support out of the box
 - Crossplatfrom - works everywhere where Node.JS does
 - Multifunctional file browser with drag-and-drop and Zip/Unzip support
 - Built-in website statistics
 - WYSIWYG-based page editor (based on CKEditor)
 - Blogging plattform (comments, different modes such as private, moderation and public)
 - Social network framework with basic functionality (friendship request, real-time messaging using Socket.IO etc.)
 - Social services authorization using OAuth protocol
 - Configurable navigation menu
 - And many, many more

## Official website and demo

Official website: https://taracot.org

TaracotJS demo website is available: https://demo.taracot.org, https://demo.taracot.org/cp (use admin/admin as login/password).

Note: the demo instance is being automatically re-installed every hour.

## Installation guide

Follow the following guide for TaracotJS instance installation: https://wiki.taracot.org/doku.php?id=installation

### Pre-requisites

Download and install Node.js for your operating system: http://nodejs.org/download/. Node Package Manager (npm) should be installed by default; if not, please take care of it's installation.

MongoDB and Redis are required. If your operating system is x64-based Windows, you may download the pre-compiled MongoDB and Redis here: http://taracot.org/source/db/mongo_redis_win64.zip. Unzip the files included to any folder on your hard disk and start using start.cmd. Two minimized console applications will be started, they should remain open every time you run TaracotJS server. For Linux/UNIX and MacOS-based operating systems you may install the corresponding MongoDB and Redis packages manually or compile from sources.

## Documentation

Github repository is available at: https://github.com/xtremespb/taracotjs

Please visit https://wiki.taracot.org/ for more information on this project.

## License

Copyright (c) 2014 Michael A. Matveev (<xtreme@rh1.ru>)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details: http://www.gnu.org/copyleft/gpl.html.