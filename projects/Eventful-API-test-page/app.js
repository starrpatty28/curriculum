require('dotenv').config()
const eventfulNode = require('eventful-node');
const client = new eventfulNode.Client(process.env.SECRET_KEY);
//const env = process.env.SECRET_KEY;
const inquirer = require("inquirer");
//connection available to all
const connection = require("./connection");

//console.log('my api' + env);

const app = {};

app.startQuestion = closeConnectionCallback => {
  inquirer
    .prompt({
      type: "list",
      message: "What action would you like to do?",
      choices: [
        "Complete a sentence",
        "Create a new user",
        "Find one event of a particular type in San Francisco next week",
        "Mark an existing user to attend an event in database",
        "See all events that a particular user is going to",
        "See all the users that are going to a particular event",
        "Exit"
      ],
      name: "action"
    })
    .then(res => {
      const continueCallback = () => app.startQuestion(closeConnectionCallback);

      if (res.action === "Complete a sentence")
        app.completeSentence(continueCallback);
      if (res.action === "Create a new user")
        app.createNewUser(continueCallback);
      if (
        res.action ===
        "Find one event of a particular type in San Francisco next week"
      )
        app.searchEventful(continueCallback);
      if (res.action === "Mark an existing user to attend an event in database")
        app.matchUserWithEvent(continueCallback);
      if (res.action === "See all events that a particular user is going to")
        app.seeEventsOfOneUser(continueCallback);
      if (
        res.action === "See all the users that are going to a particular event"
      )
        app.seeUsersOfOneEvent(continueCallback);
      if (res.action === "Exit") {
        app.closeConnectionCallback();
      }
    });
};

app.completeSentence = continueCallback => {
  //YOUR WORK HERE
  const questions = [
    {
      message: "What is your favorite color?",
      type: "input",
      name: "color"
    },
    {
      message: "What is your favorite item?",
      type: "input",
      name: "item"
    }
  ];

  inquirer.prompt(questions).then(res => {
    console.log('My favorite color is, ' + res.color + ' so my dream is to buy a ' + res.color + " " + res.item);
    continueCallback();
  });
};

app.createNewUser = continueCallback => {
  console.log('Please answer the following questions')
  //YOUR WORK HERE
  const questions = [
    {
      message: "Please enter your first and last name?",
      type: "input",
      name: "name"
    },
    {
      message: "What is your email?",
      type: "input",
      name: "email"
    },
    {
      message: "What is your age?",
      type: "input",
      name: "age"
    }
  ];
  inquirer.prompt(questions).then(result => {

    // connection.query('SELECT * FROM users',  (err, res) => {
    //   if (err) {
    //     throw err
    //   }
    //   console.log('user:', res.rows[0])
    // })

    connection.query('INSERT INTO users (name, email, age) VALUES($1, $2, $3 )', [result.name, result.email, result.age],  (err, res) => {
      if (err) {
        throw err
      }
      //console.log('user:', res.rows[0])
    })
    continueCallback(); 
  })
  //End of your work
 };


app.searchEventful = continueCallback => {
  inquirer.prompt({
    type: "input",
    name: "keyword",
    message: "What type of event would you like to view in San Francisco?"
  })
  .then( answer => {
    const { keyword } = answer;
    client.searchEvents(
      {
        keywords: keyword,
        location: "San Francisco",
        date: "Future"
      },
      (err, data) => {
        if (err) {
          return console.error(err);
        }
        eventResult = data.search.events.event[0];
        console.log(
          "This event next week that matches your keyword:"
        );
        console.log("title: ", eventResult.title);
        console.log("start_time: ", eventResult.start_time);
        console.log("venue_name: ", eventResult.venue_name);
        console.log("venue_address: ", eventResult.venue_address);
       inquirer.prompt([
        {
        type: "list",
        name: "yesorno",
        message: "Would you like to save this event?",
        choices: ["yes","no"],
        },
      ]).then( answer => {
        //console.log("You picked: ", answer.yesorno);
        if (answer.yesorno === "no"){
          
          app.searchEventful(continueCallback); 
        } else{
          connection.query('INSERT INTO events (title,start_time, venue_name, venue_address) VALUES($1, $2, $3, $4 )', [eventResult.title, eventResult.start_time, eventResult.venue_name, eventResult.venue_address], (err, res) => {
            if(err) {
              throw err
            }
         //console.log('Your event has been saved, yayy!!')
          continueCallback();

        }) 
        }
      })
      }
    );
  })
  //  console.log('Please write code for this function');
  //End of your work
 } 

//   inquirer.prompt(questions).then(res => {
//   console.log([continueCallback]);
//   //End of your work
//   continueCallback();
//   })
// };

app.matchUserWithEvent = continueCallback => {
  //YOUR WORK HERE
  const eventTitles = connection.query(
    "SELECT title FROM events",
    (error, results) => {
      if (error) {
        throw error;
      }
      let resultsArray = results.rows.map(object => object.title);
    }
  );
  let currentUserid = 0;
  inquirer
    .prompt({
      type: "input",
      name: "name",
      message: "Which user are you? Please give your name:"
    })
    .then(answer => {
      const { name } = answer;
      connection.query(
        "SELECT * FROM users WHERE name=$1",
        [name],
        (error, results) => {
          if (error) {
            throw error;
          }
          if (results === null) {
            console.log(`I'm sorry, no such user exists.`);
            //continueCallback();
          }
          currentUserid = results.rows[0].userid;
        }
      );
    })
    .then(() => {
      inquirer
        .prompt({
          type: "input",
          name: "eventid",
          message:
            "Which event would you like to save to your profile? Please give an eventid:"
        })
        .then(answer => {
          const { eventid } = answer;
          connection.query(
            "INSERT INTO users_events (userid, eventid) VALUES ($1, $2)",
            [currentUserid, eventid],
            (error, results) => {
              if (error) {
                throw error;
               }
               console.log('Your event has been saved!')
              if (results === null) {
                console.log("No such event exists");
              }
              continueCallback();
            }
          );
        });
    });
};

app.seeEventsOfOneUser = continueCallback => {
  //YOUR WORK HERE
  inquirer
    .prompt({
      type: "input",
      name: "name",
      message:
        "Which user's events would you like to see? Please give your userid:"
    })
    .then(answer => {
      const { name } = answer;
      connection.query(
        "SELECT title FROM events INNER JOIN users_events ON events.eventid = users_events.eventid WHERE users_events.userid=$1",
        [name],
        (error, results) => {
          if (error) {
            throw error;
          }
          if (results === null) {
            console.log(`I'm sorry, no such user exists.`);
            continueCallback();
          }
          return results.rows.map(object => {
            console.log(`**${object.title}**`);
            continueCallback();
          });
        }
      );
    });
};

app.seeUsersOfOneEvent = continueCallback => {
  //YOUR WORK HERE
  inquirer
    .prompt({
      type: "input",
      name: "eventid",
      message:
        "Which event attendees would you like to see? Please give an eventid:"
    })
    .then(answer => {
      const { eventid } = answer;
      connection.query(
        "SELECT name FROM users INNER JOIN users_events ON users.userid = users_events.userid WHERE users_events.eventid=$1",
        [eventid],
        (error, results) => {
          if (error) {
            throw error;
          }
          if (results === null) {
            console.log(`I'm sorry, no such event exists.`);
            continueCallback();
          }
          return results.rows.map(object => {
            console.log(`**${object.name}**`);
            continueCallback();
          });
        }
      );
    });
  //continueCallback();
};

app.closeConnectionCallback = () => {
  console.log(`
 ________  __                            __              __      __                    __ 
|        \\|  \\                          |  \\            |  \\    /  \\                  |  \\
 \\$$$$$$$$| $$____    ______   _______  | $$   __        \\$$\\  /  $$______   __    __ | $$
   | $$   | $$    \\  |      \\ |       \\ | $$  /  \\        \\$$\\/  $$/      \\ |  \\  |  \\| $$
   | $$   | $$$$$$$\\  \\$$$$$$\\| $$$$$$$\\| $$_/  $$         \\$$  $$|  $$$$$$\\| $$  | $$| $$
   | $$   | $$  | $$ /      $$| $$  | $$| $$   $$           \\$$$$ | $$  | $$| $$  | $$ \\$$
   | $$   | $$  | $$|  $$$$$$$| $$  | $$| $$$$$$\\           | $$  | $$__/ $$| $$__/ $$ __ 
   | $$   | $$  | $$ \\$$    $$| $$  | $$| $$  \\$$\\          | $$   \\$$    $$ \\$$    $$|  \\
    \\$$    \\$$   \\$$  \\$$$$$$$ \\$$   \\$$ \\$$   \\$$           \\$$    \\$$$$$$   \\$$$$$$  \\$$
                                                                                          
                                                                                          
                                                                                          
`);
  process.exitCode = 0;
  process.exit();
}

module.exports = app;

