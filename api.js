import mysql from 'mysql';
import cron from 'cron';
import fetch, {
    Headers
} from "node-fetch";
var timer = '*/15 * * * *'    // run 15ph 1 lần

function executeTask() {
    //import mysql from 'mysql';
    //import cron from 'cron';
    //import fetch, {
    //    Headers
    ///} from "node-fetch";

    var testmode = 1;
    var bot_token = "6542277150:AAE-d8eiLo8KFcsyE_L4zMQRn0fV3DQ39gQ";
    var chat_id = "-914175664";

    var con = mysql.createConnection({
        host: "master",
        user: "root",
        password: "test",
        database: "count"
    });

    // Header Graylog API
    var myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Authorization", "Basic bW9uaXRvcjptT0pnMmVTOXhwREZ6SVVo");
    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    // Array
    let myArray = new Array();
    let myArray4 = new Array();
    let myArray2 = new Array();

    // Get Date 
    //let fecha = new Date().toISOString().split('T')[0];
    //console.log(currentDate);
    let currentDateGMT = new Date().toUTCString();
    let currentDateGMTPlus7 = new Date(currentDateGMT);
    currentDateGMTPlus7.setHours(currentDateGMTPlus7.getHours() + 7);
    currentDateGMTPlus7.setDate(currentDateGMTPlus7.getDate() - 1);
    let fecha = currentDateGMTPlus7.toISOString().split('T')[0];
    const from_d = fecha + " 00:00:00";
    const to_d = fecha + " 23:59:59";
    //console.log(fecha);
    // Fetch Graylog API
    var url = "http://maillog.vccloud.vn:9000/api/search/universal/absolute?query=collector_node_id%3A%20capt-ima*%20AND%20%22%24forwarded%22%20%26%26%20%22dovecot%3A%20lmtp%22&from=" + encodeURIComponent(from_d) + "&to=" + encodeURIComponent(to_d) + "&limit=10000&filter=streams%3A000000000000000000000001&fields=message&decorate=true";
    fetch(url, requestOptions)
        .then(response => response.json())
        .then(result => {
            var limit = Object.keys(result.messages).length;
            for (var i = 0; i < limit; i++) {
                var result2 = result.messages[i].message.message;
                const searchTerm2 = '):';
                const indexOfFirst2 = result2.indexOf(searchTerm2);
                const searchTerm3 = 'to <';
                const indexOfFirst3 = result2.indexOf(searchTerm3);
                const searchTerm = '(';
                const indexOfFirst = result2.indexOf(searchTerm);
                const cat = result2.substr(indexOfFirst + 1, indexOfFirst2 - indexOfFirst - 1);
                const cat2 = result2.substr(indexOfFirst3 + 4, result2.length - indexOfFirst3 - 5);
                const searchmail = '@';
                const itemloca = cat.indexOf(searchmail);
                const domain1 = cat.substr(itemloca + 1);
                const itemloca2 = cat2.indexOf(searchmail);
                const domain2 = cat2.substr(itemloca2 + 1);
                myArray4.push(new Array(cat, cat2, domain1, domain2));
            }
            for (var i = 0; i < myArray4.length; i++) {
                if (myArray4[i][2] == myArray4[i][3]) {
                    myArray4.splice(i, 1);
                    i--;
                }

            }

            for (var i = 0; i < myArray4.length; i++) {
                myArray.push(myArray4[i][2]);
            }


            function countFreq(arr, n) {
                let visited = Array.from({
                    length: n
                }, (_, i) => false);
                for (let i = 0; i < n; i++) {
                    if (visited[i] == true)
                        continue;
                    let count = 1;
                    for (let j = i + 1; j < n; j++) {
                        if (arr[i] == arr[j]) {
                            visited[j] = true;
                            count++;
                        }
                    }
                    myArray2.push("%0A" + arr[i] + " : " + count + "");
                }
            }

            let n = myArray.length;
            countFreq(myArray, n);
            myArray2 = JSON.stringify(myArray2);
            myArray2 = myArray2.toString();
            for (var i = 0; i < myArray2.length; i++) {
                myArray2 = myArray2.replace('","', ' ')
            } {
                myArray2 = myArray2.replace('["', ' ')
            } {
                myArray2 = myArray2.replace('"]', ' ')
            }
            var sql = "INSERT INTO customers (date,times) VALUES ('" + fecha + "','" + myArray2 + "');";
            var delete_sql = "DELETE FROM customers WHERE date='" + fecha + "'";

            //SQL
            con.connect(function(err) {
                if (err) throw err;
                console.log("Connected! Mysql ");
                con.query(sql, function(err, result) {
                    if (err) {
                        console.log("DB trùng data STOP");
                        process.exit(1);
                    } else
                        console.log("1 record inserted");
                });

                if (testmode == 0) {
                    con.query(delete_sql, function(err, result) {
                        if (err) {
                            console.log("DB trùng data STOP");
                            //process.exit(1);
                        } else
                            console.log("Delete");
                    });
                } else console.log("Normal")

                con.end(function(err) {
                    if (err) throw err;
                    console.log("Quit! Mysql ");
                });
            });

            var message_header = from_d + " to " + to_d;
            var url2 = "http://api.telegram.org/bot" + bot_token + "/sendMessage?chat_id=" + chat_id + "&parse_mode=markdown&text=```%0A" + message_header + "%0A" + myArray2 + "%0A ```";
            //var url2 = "http://api.telegram.org/bot" + bot_token + "/sendMessage?chat_id=" + chat_id + "&parse_mode=markdown&text=```%0A" + message_header + "%0A %0A ```";
            var requestOptions = {
                method: 'GET',
                redirect: 'follow'
            };
            /*         fetch(url2, requestOptions,)
                        .then(response => response.json())
                        .then(result => console.log(result))
                        .catch(error => console.log('error', error)); */


            const controller = new AbortController();
            const timeout = setTimeout(() => {
                controller.abort();
            }, 10000); // will time out after 1000ms
            function retry() {
                const controller = new AbortController();
                const timeout = setTimeout(() => {
                    controller.abort();
                }, 10000); // will time out after 1000ms	
                fetch(url2, {
                        signal: controller.signal,
                        method: 'GET',
                        redirect: 'follow'
                    })
                    .then(response => response.json())
                    .then(json => console.log(json))
                    .catch(err => {
                        if (err.name === 'AbortError') {
                            retry(); // console.log('Timed out');
                        }
                    })
                    .finally(() => {
                        clearTimeout(timeout);
                    });

            }
            fetch(url2, {
                    signal: controller.signal,
                    method: 'GET',
                    redirect: 'follow'
                })
                .then(response => response.json())
                .then(json => console.log(json))
                .catch(err => {
                    if (err.name === 'AbortError') {
                        retry();
                    }
                })
                .finally(() => {
                    clearTimeout(timeout);
                });


        })
        .catch(error => console.log('error'));

}
const scheduledJob = new cron.CronJob(timer, executeTask);
console.log('Cron job scheduled');
scheduledJob.start();
