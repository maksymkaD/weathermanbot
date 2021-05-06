'use strict';

require('dotenv').config()


const Telegraf = require('telegraf').Telegraf;
const readline = require('readline');
const fetch = require('node-fetch');

const LOGGED_HISTORY_OFFSET=3; //number of last messages that will be saved
var saved_messages = new Array(LOGGED_HISTORY_OFFSET); //messages are saved in order from newer to older
const bot = new Telegraf(process.env.BOT_TOKEN); //bot token
const WEATHER_API_TOKEN = process.env.WEATHER_API_TOKEN; //openweathermap api token
const WEATHER_CLUB_ID = process.env.WEATHER_CLUB_ID; //telegram chat id

const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
});

bot.on(['message'],  (ctx) => {
    if(ctx.message.text==='/stop_weather') bot.stop();
    else {
       saved_messages.shift(); 
       saved_messages.push(ctx.message);
    }
});
bot.launch();

 
 
var askForCity = async function () {

    rl.question("", function (answer) {
      if (answer == 'exit') {
        bot.stop();
        return rl.close(); 
      }

        fetch(`http://api.openweathermap.org/data/2.5/weather?q=${answer}&appid=${WEATHER_API_TOKEN}`).
        then((response) => { return response.json();}).
        then(async(data) => {  
             try {
            let city = data["name"];
            let wind_speed = data["wind"]["speed"];
            let temp = data["main"]["temp"];
            let feels_like = data["main"]["feels_like"];
            let descr = data["weather"][0]["main"];

            let message = await
            bot.telegram.sendMessage(WEATHER_CLUB_ID,`Weather in ${city} : ${descr}\n`+
            `Temperature: ${temp}K° | ${toCelsius(temp)}C° | ${toFahrenheit(temp)}F°\n`+
            `Feels like: ${feels_like}K° |" ${toCelsius(feels_like)}C° | ${toFahrenheit(feels_like)}F°\n`+
            `Wind: ${wind_speed} m/s`);

            let empty_history=true;
            for(let i=saved_messages.length-1; i >=0 ; i--) {
              if(saved_messages[i]!=null) {
               let first_name = saved_messages[i]["from"]["first_name"];
               let last_name = typeof saved_messages[i]["from"]["last_name"] == 'undefined' ? "" : saved_messages[i]["from"]["last_name"];
               let text = saved_messages[i]["text"];
               empty_history = false;
               console.log("Message: "+text+"\nAuthor: "+first_name+last_name+"\n===================");
              }
            }
            if(empty_history) console.log("Currently there are no saved messages.");
            console.log('Enter city ("exit" to stop): ');

             } catch {
               console.log(data["cod"]," ",data["message"]);
             }
          });
         
        
        askForCity(); 
    }); 
};
  
console.log('Enter city ("exit" to stop): ');
askForCity(); 

function toCelsius(kelvins) {
    return normaliseNumber(kelvins - 273.15);
}

function toFahrenheit(kelvins) {
   return normaliseNumber(toCelsius(kelvins)*(9.0/5.0) + 32.0);
} 

function normaliseNumber(num) {
    return Math.floor(num*10)/10;
}


