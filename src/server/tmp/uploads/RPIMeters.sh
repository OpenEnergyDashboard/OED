# /bin/bash

# !Executes curl command to create meters and upload readings into meters.

# These are value that might need changing depending on setup.

# This is using the default admin. It should be changed to a user with role CSV in your OED installation.
csvUser=test@example.com
csvPassword=password
# This is the URL to your OED site. The one given is normally used in code development as the machine you are on. It should be changed to the http://<your OED site>.
# Also, probably want https: for security reasons but need to turn on and support at your site.
url=http://localhost:3000
# CSV file with meter data
meterFile=RPIMeters.csv

# Upload meters.

echo -e "\nStarting upload of meters from file $meterFile.\n"
# Run curl capturing output in $output. It adds a string at the end that is expect to be HTTP_RETURN_CODE_START <code from HTTP request> HTTP_RETURN_CODE_END.
output=`curl -s -w "HTTP_RETURN_CODE_START %{http_code} HTTP_RETURN_CODE_END" $url'/api/csv/meters' -X POST -F 'headerRow=yes' -F 'gzip=no' -F 'email='$csvUser -F 'password='$csvPassword -F 'csvfile=@'$meterFile`
# Grap the return code from curl right away.
curlCode=$?
# Check if any errors occurred.
# See if curl had an error code
if [ $curlCode -ne 0 ]
then
   echo -e "\n***curl returned an error code of $curlCode so the upload probably failed.***\n"
   exit $curlCode
fi
# Check if OED returned a failure. The code is exptect at the end of the output string surroutned by HTTP_RETURN_CODE_START <code from HTTP request> HTTP_RETURN_CODE_END.
# This should still find code even if not the last thing in output.
# Get everything after the HTTP_RETURN_CODE_START meaning right before the HTTP code.
httpCode=${output#*HTTP_RETURN_CODE_START}
# Get everything before the HTTP_RETURN_CODE_END right after the HTTP code. This should only leave the HTTP return code.
httpCode=${httpCode%HTTP_RETURN_CODE_END*}
# Check if the curl request did not get a 200 response so something is wrong.
if [ $httpCode -ne 200 ]
then
   echo -e "\n***HTTP request via curl returned an error code of $httpCode so meter upload probably had issues.***"
   echo -e "The output was:\n$output"
   exit $httpCode
fi
