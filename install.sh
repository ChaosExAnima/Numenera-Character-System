#! /bin/bash

npm install
bower install
mongoimport --jsonArray -d numenera-characters -c characters --file fixtures/leve.json
mongoimport --jsonArray -d numenera-characters -c characters --file fixtures/benthre.json
grunt