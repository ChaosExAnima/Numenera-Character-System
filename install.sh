#! /bin/bash

npm install
bower install
mongoimport --jsonArray -d numenera-characters -c characters --upsert --file fixtures/leve.json
mongoimport --jsonArray -d numenera-characters -c characters --upsert --file fixtures/benthre.json
grunt