#!/bin/bash
echo "Preprocessing tweets"

STATIC_PATH=../static
CONTENT_PATH=../content

SCRIPT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

cd $SCRIPT_PATH

# setup
if [ ! -d "tmp" ]; then
    echo "Making tmp/"
    mkdir tmp
fi

if [ ! -d "$STATIC_PATH" ]; then
    echo "Making $STATIC_PATH/"
    mkdir $STATIC_PATH
fi

if [ ! -d "$STATIC_PATH/captures" ]; then
    echo "Making $STATIC_PATH/captures/"
    mkdir $STATIC_PATH/captures
fi

grep -rh "{{< johnmu/tweet " $CONTENT_PATH/ | grep -oP "(?<=[ \"/])[0-9]+" | sort | uniq >tmp/tweetids.txt

countchecked=0
countmade=0
countfailed=0
while read line; do
    FILE="$STATIC_PATH/captures/tweet_$line.png"
    if [ ! -f "$FILE" ]; then
        echo "$FILE does not exist: generating ..."
        if ! node tweet_screenshot.js "$line" "$FILE"; then
            echo "ERROR: Failed to generate screenshot for $line"
            countfailed=$((countfailed + 1))
        else
            countmade=$((countmade + 1))
        fi
    fi
    countchecked=$((countchecked + 1))
done <tmp/tweetids.txt

echo "Checked $countchecked tweets, generated $countmade screenshots."
if [ $countfailed -gt 0 ]; then
    echo "WARNING: $countfailed screenshots failed to generate."
fi
