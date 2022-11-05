#!/bin/bash
echo "Preprocessing toots"

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

grep -rh "{{< johnmu/toot " $CONTENT_PATH | grep -oP "(?<=/toot \")[^\">]*" | sort | uniq >tmp/tooturls.txt

countchecked=0
countmade=0
while read LINE; do
    URLPARTS=(${LINE//\// })
    IDPART=${URLPARTS[3]}
    FILE="$STATIC_PATH/captures/toot_$IDPART.png"
    if [ ! -f "$FILE" ]; then
        echo "$FILE does not exist: generating ..."
        node toot_screenshot.js "$LINE" "$FILE"
        countmade=$((countmade + 1))
    fi
    countchecked=$((countchecked + 1))
done <tmp/tooturls.txt

echo "Checked $countchecked toots, generated $countmade screenshots."
