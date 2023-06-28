const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
require("dotenv").config();

const GEOLOCATIONAPI = process.env.GEOLOCATIONAPI; //! Geolocation api from Abstract api
const botToken = process.env.TOKEN;
const WEATHERAPI = process.env.WEATHERAPI; //! Weather api from OpenWeatherMap
const bot = new TelegramBot(botToken, { polling: true });

let users = [];

//TODO: Command for subscribing to daily weather updates
bot.onText(/\/subscribe/, (msg) => {
  const chatId = msg.chat.id;

  //TODO: Check if the user is already subscribed
  const existingUser = users.find((user) => user.chatId === chatId);
  if (existingUser) {
    bot.sendMessage(chatId, "You are already subscribed!");
    return;
  }

  //TODO: Add the user to the users array with the subscribed status
  users.push({ chatId: chatId, subscribed: true });
  console.log(users);
  bot.sendMessage(
    chatId,
    "You have successfully subscribed to daily weather updates!"
  );
});

//TODO: Command for unsubscribing from daily weather updates
bot.onText(/\/unsubscribe/, (msg) => {
  const chatId = msg.chat.id;

  //TODO: Find the user in the users array
  const userIndex = users.findIndex((user) => user.chatId === chatId);
  if (userIndex === -1) {
    bot.sendMessage(chatId, "You are not subscribed!");
    return;
  }

  //TODO: Remove the user from the users array
  users.splice(userIndex, 1);
  bot.sendMessage(
    chatId,
    "You have successfully unsubscribed from daily weather updates!"
  );
});

//TODO: Command for requesting weather updates
bot.onText(/\/updates/, (msg) => {
  const chatId = msg.chat.id;

  //* Check if the user is subscribed
  const subscribedUser = users.find(
    (user) => user.chatId === chatId && user.subscribed
  );
  if (!subscribedUser) {
    bot.sendMessage(
      chatId,
      "You are not subscribed to weather updates. Use /subscribe to subscribe."
    );
    return;
  }

  //TODO: Fetch user's city name using IP geolocation
  axios
    .get(`https://ipgeolocation.abstractapi.com/v1/?api_key=${GEOLOCATIONAPI}`)
    .then((response) => {
      const cityName = response.data.city;
      const latitude = response.data.latitude;
      const longitude = response.data.longitude;
      if (cityName) {
        //* Fetch live temperature from OpenWeatherMap API using user's city name
        axios
          .get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHERAPI}`
          )
          .then((response) => {
            const temperature = response.data.main.temp - 273.15;
            const atmosphere = response.data.weather[0].main;
            const minTemp = response.data.main.temp_min - 273.15;
            const maxTemp = response.data.main.temp_max - 273.15;
            const windSpeed = response.data.wind.speed;
            bot.sendMessage(
              chatId,
              `Current temperature : ${temperature.toFixed(
                2
              )}°C \nWeather : ${atmosphere} \nMinimum Temperature : ${minTemp.toFixed(
                2
              )}°C \nMaximum Temperature : ${maxTemp.toFixed(
                2
              )}°C \nWind Speed : ${windSpeed} m/s`
            );
          })
          .catch((error) => {
            console.error(error);
            bot.sendMessage(
              chatId,
              "Sorry, an error occurred while fetching the weather data."
            );
          });
      } else {
        bot.sendMessage(chatId, "Sorry, unable to determine your location.");
      }
    })
    .catch((error) => {
      console.error(error);
      bot.sendMessage(
        chatId,
        "Sorry, an error occurred while retrieving your location."
      );
    });
});

//TODO: Start the bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Welcome to the Weather Update Bot! Use /subscribe to subscribe for daily weather updates, /unsubscribe to unsubscribe, and /updates to get the latest weather update."
  );
});

//TODO: Error handling
bot.on("polling_error", (error) => {
  console.error(error);
});

//? Run the bot
console.log("Weather Update Bot is running...");
