StarterProject
=============
This is for git



SETUP INSTRUCTIONS:
===================
REMEMBER to add a git.ignore to the sftp-config.json!
REMEMBER to add fix the sftp-ignore:
>>>>>>>REPLACE WITH THIS>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
"ignore_regexes": [
    "\\.sublime-(project|workspace)", "sftp-config(-alt\\d?)?\\.json",
    "sftp-settings\\.json", "_private", "/venv/", "\\.svn/", "\\.hg/", "\\.git/",
    "\\.bzr", "_darcs", "CVS", "\\.DS_Store", "Thumbs\\.db", "desktop\\.ini"
],
>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

This project includes some basic controllers, services, directives, views, and partials to get you started.
The appearance, functionality, and purpose of the website is completly up to you.
We will walk through the setup step by step so you can get started right away.


DEVELOPMENT ENVIRONMENT:
------------------------
There are a few tools and accounts which you will need in order to begin.
Tools:
	- Sublime Text 2
	- WBond SFTP, SVN
	- AppEngine
	- Parse Cloud EXE

Accounts:
	- Github
	- Parse.com
	- Firebase.com
	- Google Cloud Account




PROJECT CODE:
-------------
We are creating an AngularJS application.  We will be using parse.com as the database service, and firebase for any realtime communication connections.
The idea for AngularJS began in 2009, but the first stable release wasn't until 2012, and there hadn't been consistant stable releases until 2013.
AngularJS is a new technology and a great concept.  Google maintains this open-source project.  Anyone can contribute, and some major contributors have been hired by Google to work on the Angular team.

When we program for the internet there are three 'languages' per-se: 'JavaScript (JS)', 'CSS', and 'HTML'.
HTML: html is 'Hyper Text Markup Language' it is a 'Markup Language'.  You use this to organize your content.
CSS: You use CSS to style your HTML.  You use this to make everything look awesome, snazzy, fancy, retro, or whatever theme you want to portray.
JS: You use JS to write logic, functions, store information, do math, and do really cool stuff.
AngularJS is a great way to link all three together.
Your JS (JavaScript) coding will be done in the 'app' folder
Your CSS coding will be done in 'assets/css'
Your HTML coding will be done in the 'partials' and 'views' folders.
If you want to include JS files that others have made you will put them in 'assets/js'
If you want to include any other type of file, you can put it in it's appropriate 'assets/__folder__'