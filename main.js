var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var fs = require("fs");

app.use(express.static("statics"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({//处理以form表单的提交
	extended: true
}))

var User = require("./models/user");
//将当前全局对象下的Promise赋值给mongoose.promise
mongoose.Promise = global.Promise;
//链接mongodb数据库,第二个参数表示兼容老版本mongo
mongoose.connect("mongodb://localhost:27017/lagou", function(err){
	if(!err){			//此处这个函数的第一个参数是mongoose库提供的一个内置的错误对象
		console.log("连接成功")
	}else{
		console.log("连接失败")
	}
});

//验证用户名是否存在
app.post("/checkReg", function(req, res){
	User.find(req.body, function(err, doc){//doc查到的数据
		if(err){return};
		if(doc.length){
			res.json({
				code: 1,
				msg: "用户名已存在！"
			})
		}else{
			res.json({
				code: 0,
				msg: "用户名可用"
			})
		}
	})
})
//提交注册
app.post("/register", function(req, res){
	var user = new User(req.body);
	user.save(function(err, doc){
		if(err){
			res.send({
				code: 1,
				msg: err
			})
		}else{
			res.send({
				code: 0,
				msg: "注册成功！"
			})
		}
	})
})
//用户登录
app.post("/login", function(req, res){
	var {username, pwd} = req.body;
	User.find({username}, function(err, doc){
		if(err){return};
		if(!doc.length){
			res.send({
				code: 1,
				msg: "用户名不存在！"
			})
		}else{
			if(pwd === doc[0].pwd){
				res.send({
					code: 0,
					msg: "登陆成功！"
				})
			}else{
				res.send({
					code: 2,
					msg: "密码错误！"
				})
			}
		}
	})
})


//上传logo
var upload = require("./statics/js/upload");
app.use(express.static("uploadcache"));
app.post("/upload", function(req, res){
	//upload.upload()是在formidable的配置文件中用exports.upload定义的一个函数,这个函数中引用了formidable插件，同时也包含了返回给前端数据的过程（可以阅读这个formidable配置文件）
	upload.upload(req, res);
})
//提交job list
var Job = require("./models/job");
app.post("/sbtJob", function(req, res){
	var job = new Job(req.body);
	job.save(function(err, doc){//这个doc就是存储的对象
		if(err){return};
		res.json({
			code: 0,
			list: [doc]
		})
	})
})
//获取所有job list
app.get("/loading", function(req, res){
	Job.find({}, function(err, doc){
		if (err) {return};
		res.send({
			code: 0,
			list: doc
		})
	})
})
//删除指定item
app.post("/deleteItem", function(req, res){
	var {_id, imgSrc} = req.body;
	Job.findOneAndRemove({_id}, function(err, doc){
		if(err){return};
		res.send({
			code: 0,
			msg: "删除成功！"
		})
	})
	fs.unlink("./uploadcache" + imgSrc, function(err){
		if(err){
			throw err;
		}else{
			console.log("图片删除成功")
		}
	})
})
//修改指定item
app.post("/updateItem", function(req, res){
	var {
		_id,
		oldImgSrc,
		logo,
		jobName,
		companyName,
		jobExp,
		jobType,
		jobPlace,
		jobMoney
	} = req.body;
	Job.findOneAndUpdate({_id}, 
		{logo,
		jobName,
		companyName,
		jobExp,
		jobType,
		jobPlace,
		jobMoney}, {new: true}, function(err, doc){
			if(err){return};
			res.send({
				code: 0,
				list: [doc]
			})
		})
	fs.unlink("./uploadcache" + oldImgSrc, function(err){
		if(err){
			throw err;
		}else{
			console.log("原图已删除")
		}
	})
})
app.listen(4396, function(){
	console.log("启动成功")
})