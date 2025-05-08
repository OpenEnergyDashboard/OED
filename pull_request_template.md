# Description

Implemented DOMPurify to sanitize HTML responses from response.js and success.js. Created sanitizer.js as a centralized, pre-configured instance of DOMPurify on the server. This also allows for implementation of sanitization elsewhere if needed in the future. These changes remediate a cross-site scripting vulnerability when users upload meter data.

Fixes problem report 3 from the penetration test report.

Developed and implemented by:
Thomas Nigro - https://github.com/tnigro45
Landon Wivell - https://github.com/Landon-Wivell

## Type of change

(Check the ones that apply by placing an "x" instead of the space in the [ ] so it becomes [x])

- [ ] Note merging this changes the database configuration.
- [ ] This change requires a documentation update

## Checklist

(Note what you have done by placing an "x" instead of the space in the [ ] so it becomes [x]. It is hoped you do all of them.)

- [x] I have followed the [OED pull request](https://openenergydashboard.org/developer/pr/) ideas
- [ ] I have removed text in ( ) from the issue request
- [x] You acknowledge that every person contributing to this work has signed the [OED Contributing License Agreement](https://openenergydashboard.org/developer/cla/) and each author is listed in the Description section.

## Limitations

N/A
