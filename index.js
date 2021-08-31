//Dependencies
const Recursive_Readdir = require("recursive-readdir")
const I2rys = require("./utils/i2rys")
const Request = require("request")
const Delay = require("delay")
const Chalk = require("chalk")
const Path = require("path")
const Fs = require("fs")

//Variables
const Configs = Fs.readdirSync("./configs", "utf8")
const Self_Args = process.argv.slice(2)

var GitSpy_Data = {}
GitSpy_Data.self = ""
GitSpy_Data.self_extra = ""
GitSpy_Data.closing = false

//Function
function close(){
    I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "It looks like the scanning is finished/You decided to exit GitSpy.")
    I2rys.log("yellowish", "WARN", "GitSpy Debugger:", "Stopping GitSpy process.")

    I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Checking if there are any information that have been gathered.")
    if(GitSpy_Data.self.length == 0){
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "It looks like there are no information that is gathered.")
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Exiting...")
        process.exit()
    }else{
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "It looks like there are some information that is gathered.")

        const results_file_name = `${Self_Args[0]}_${Math.floor(Math.random() * 9999999999)}`

        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Saving the results before exiting, please wait.")
        Fs.writeFileSync(`./results/${results_file_name}.txt`, GitSpy_Data.self, "utf8")
        
        if(GitSpy_Data.self_extra.length != 0){
            Fs.writeFileSync(`./results/${results_file_name}_extra.txt`, GitSpy_Data.self_extra, "utf8")
        }else{
            Fs.writeFileSync(`./results/${results_file_name}_extra.txt`, "Empty.", "utf8")
        }
        
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", `results have been saved to ./results/${results_file_name}.txt`)
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Exiting...")
        process.exit()
    }
}

function walk(dir, done) { //Not mine :)
    var results = [];
    Fs.readdir(dir, function(err, list) {
      if (err) return done(err);
      var pending = list.length;
      if (!pending) return done(null, results);
      list.forEach(function(file) {
        file = Path.resolve(dir, file);
        Fs.stat(file, function(err, stat) {
          if (stat && stat.isDirectory()) {
            walk(file, function(err, res) {
              results = results.concat(res);
              if (!--pending) done(null, results);
            });
          } else {
            results.push(file);
            if (!--pending) done(null, results);
          }
        });
      });
    });
  };

function get_user_information(body){
    Request(`https://api.github.com/users/${Self_Args[0]}/events`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 5.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2952.5 Safari/537.36"
        }
    }, function(err, res, body2){
        if(err){
            I2rys.log("yellowish", "CRITICAL", "GitSpy Debugger:", "It looks like Github API is down.")
            GitSpy_Data.closing = true

            close()
            return
        }

        const temp_emails = body2.match(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9.-]+/g)
        var emails = []

        GitSpy_Data.self = "==========+========== Github user information ==========+=========="
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Getting the Github user url.")
        GitSpy_Data.self += `\nGithub Url: ${body.items[0].html_url}`
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Getting the Github user name.")
        GitSpy_Data.self += `\nName: ${Self_Args[0]}`
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Getting the Github user id.")
        GitSpy_Data.self += `\nID: ${body.items[0].id}`
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Getting the Github user avatar.")
        GitSpy_Data.self += `\nAvatar: ${body.items[0].avatar_url}`
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Getting the Github user email addresses.")

        if(temp_emails != ""){
            for( i in temp_emails ){
                if(emails.indexOf(temp_emails[i]) == -1){
                    emails.push(temp_emails[i])
                }
            }

            GitSpy_Data.self += `\nEmail addresses: ${emails}`
        }

        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Checking if the Github user is an admin.")
        GitSpy_Data.self += `\nIs user Github admin: ${body.items[0].site_admin}`
    
        get_user_followers()
    })
}

function get_user_followers(){
    var followers = ""

    I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Getting the Github user followers.")
    Request(`https://api.github.com/users/${Self_Args[0]}/followers`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 5.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2952.5 Safari/537.36"
        }
    }, function(err, res, body){
        if(err){
            I2rys.log("yellowish", "CRITICAL", "GitSpy Debugger:", "It looks like Github API is down.")
            GitSpy_Data.closing = true

            close()
            return
        }

        body = JSON.parse(body)

        if(body.length == 0){
            I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "It looks like the Github user doesn't have any followers, sad.")

            download_user_repositories()
            return
        }else{
            for( i in body ){
                if(followers.length == 0){
                    followers = body[i].login
                }else{
                    followers += `, ${body[i].login}`
                }
            }

            GitSpy_Data.self += `\nFollowers: ${followers}`

            GitSpy_Data.closing = true

            download_user_repositories()
        }
    })
}

function download_user_repositories(){
    I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Will download the Github user repositories for further checking, this might take a while.")
    Request(`https://api.github.com/users/${Self_Args[0]}/repos`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 5.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2952.5 Safari/537.36"
        }
    }, function(err, res, body){
        if(err){
            I2rys.log("yellowish", "CRITICAL", "GitSpy Debugger:", "It looks like Github API is down.")
            GitSpy_Data.closing = true

            close()
            return
        }

        body = JSON.parse(body)

        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Checking if the Github user have repositories.")
        if(body.length == 0){
            I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "It looks like the Github user doesn't have any repositories")
            I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Finished.")
            GitSpy_Data.closing = true
    
            close()
            return
        }else{
            I2rys.log("yellowish", "INFO", "GitSpy Debugger:", `It looks like the Github user have ${body.length} repositories.`)
            var max_repository = 0
    
            I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Downloading has started.")
            Loop()
            async function Loop(){
                await Delay(100)

                if(max_repository == body.length){
                    I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Downloading is finished")
                    I2rys.log("yellowish", "WARN", "GitSpy Debugger:", "Please wait 5 seconds to avoid unloaded packages not getting scanned.")

                    await Delay(5000)
                    repositories_checking()
                    return
                }
    
                I2rys.log("yellowish", "INFO", "GitSpy Debugger:", `Downloading repository ${body[max_repository].html_url}`)
                require("child_process").exec(`cd temp && git clone ${body[max_repository].html_url}.git`, function(err, stdout, stderr){
                    if(err){
                        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", `Unable to download repository ${body[max_repository].html_url}`)
    
                        max_repository += 1
                        Loop()
                        return
                    }
    
                    I2rys.log("yellowish", "INFO", "GitSpy Debugger:", `Repository ${body[max_repository].html_url} successfully downloaded`)

                    max_repository += 1
                    Loop()
                    return
                })
            }
        }
    })
}

function repositories_checking(){
    var files = []

    I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Scanning download repositories files.")
    walk("./temp", function(err, temp_files){
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", `${temp_files.length} files found.`)
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Purging useless files on the list, please wait.")
        
        for( i in temp_files ){
            if(temp_files[i].indexOf(".git") == -1){
                files.push(temp_files[i])
            }
        }

        var file_index = 0

        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Purging is done")
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", `Now ${files.length} files left & not useless.`)
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", `${Configs.length} configs found.`)
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Files leaks scanning has started.")

        Loop()
        async function Loop(){
            await Delay(100)

            if(file_index == files.length){
                I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Github user repositories scanning is finished.")
                GitSpy_Data.closing = true
        
                close()
                return
            }

            const file_data = Fs.readFileSync(files[file_index], "utf8")
            const file_path = files[file_index].slice(files[file_index].indexOf("GitSpy"), files[file_index].length)
            
            for( i in Configs ){
                const config = require(`./configs/${Configs[i]}`)
                const config_regex = new RegExp(config.regex, config.regex_extra)
                const config_regex_results = file_data.match(config_regex)

                if(Self_Args[1] == "true"){
                    I2rys.log("yellowish", "INFO", "GitSpy Debugger:", `[${file_path}] ${config.description}`)
                }

                if(config_regex_results != [] && config_regex_results != "" && config_regex_results != null){
                    I2rys.log("yellowish", "INFO", "GitSpy Debugger:", `[${file_path}] ${config.found}${config_regex_results}`)

                    if(GitSpy_Data.self_extra.length == 0){
                        GitSpy_Data.self_extra = `[${file_path}] ${config.found}${config_regex_results}`
                    }else{
                        GitSpy_Data.self_extra += `\n[${file_path}] ${config.found}${config_regex_results}`
                    }
                }else{
                    if(Self_Args[1] == "true"){
                        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", `[${file_path}] ${config.no_found}`)
                    }
                }
            }

            file_index += 1
            Loop()
            return
        }
    })
}

//Main
if(Self_Args.length == 0){
    console.log(`node index.js <github_username> <aggressive_logging>
Example: node index.js I2rys false`)
    process.exit()
}

if(Self_Args[0] == ""){
    I2rys.log("yellowish", "CRITICAL", "GitSpy Debugger:", "It looks like the Github user you specified is invalid.")
    GitSpy_Data.closing = true

    close()
    return
}

if(Self_Args[1] == "" || Self_Args[1] == null){
    I2rys.log("yellowish", "CRITICAL", "GitSpy Debugger:", "Invalid true/false aggressive_logging option.")
    GitSpy_Data.closing = true

    close()
    return
}

I2rys.log("yellowish", "WARN", "GitSpy Debugger:", "Purging temp folder, please wait.")
require("child_process").execSync("rm -r temp")
Fs.mkdirSync("./temp")
I2rys.log("yellowish", "WARN", "GitSpy Debugger:", "temp folder has been purged.")

I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Checking if the Github user exist, please wait.")
Request(`https://api.github.com/search/users?q=${Self_Args[0]}`, {
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 5.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2952.5 Safari/537.36"
    }
}, function(err, res, body){
    if(err){
        I2rys.log("yellowish", "CRITICAL", "GitSpy Debugger:", "It looks like Github API is down.")
        GitSpy_Data.closing = true

        close()
        return
    }

    body = JSON.parse(body)

    if(body.total_count == 1){
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Github user exist.")
        I2rys.log("yellowish", "INFO", "GitSpy Debugger:", "Scanning the Github user information & repositories for any leaks specified.")
        get_user_information(body)
        return
    }else{
        I2rys.log("yellowish", "CRITICAL", "GitSpy Debugger:", "It looks like the Github user you specified is invalid.")
        GitSpy_Data.closing = true

        close()
        return
    }
})

process.on("SIGINT", function(){
    if(!GitSpy_Data.closing){
        GitSpy_Data.closing = true

        close()
    }
})
