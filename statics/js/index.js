$(function(){
	$("header").load("./html/header.html", function(){
		$.getScript("js/header.js", function(){
			if($(".navfr .name").is(":visible")){//如果已经登录，渲染列表
				$("div.bginfo").hide();
				$(".job").show();

				var toPage = function(){
					var pageNavObj = new PageNavCreate("PageNavId",{ 
						pageCount: pages.counts, 
						currentPage: pages.curr, 
						perPageNum: pages.per
					});
					pageNavObj.afterClick(function(page){
						pages.curr = page;
						toPage();
						loadFn();
					});
				};
				var pages = {
						preCount: 8,//每页数据数量
						counts: null, //总页数
						curr: 1, //当前页
						per: 5 //显示页码个数
					}; 
				var loadFn = null; 
				var promiseLoad = new Promise(function(resolve){
					loadFn = (function loadPag(page = pages.curr){
						$.get("/loading", function(data){
							pages.counts = Math.ceil(data.list.length / pages.preCount);
							if(pages.sbt && data.list.length % pages.preCount === 1){
								page = ++pages.curr;
							}else if(pages.del && data.list.length % pages.preCount === 0 && pages.curr - 1 === pages.counts){
								page = --pages.curr;
							}
							pages.per = Math.min(pages.counts, pages.per);
							var obj = {}; 
							obj.list = [];
							data.list.forEach(function(v, i){
								if((page - 1) * pages.preCount <= i && page * pages.preCount - 1 >= i){//范围内push
									v.idx = i + 1;
									obj.list.push(v);
								}
							})
							var html = template("jobTemp", obj);
							$("tbody").html(html);
							pages.sbt = null;
							pages.del = null;
							toPage();
							resolve();//ajax异步操作完成后进行下一步操作
						})
						return loadPag;
					})();
				});

				promiseLoad.then(function(){
					//选择图片(预览)
					var formdata = null;
					$("#job_file").change(function(){
						var type = this.files[0].type;
						if(type === "image/png" || type === "image/jpeg"){
							formdata = new FormData();
							formdata.append("upload", this.files[0]);
							var reader = new FileReader();
							reader.onload = function(e){
								$("#logo").show().attr("src", e.target.result).siblings("span").hide();
							}
							reader.readAsDataURL(this.files[0]);
						}
					})
				
					//提交job list
					$("button[data-target=#job]").click(function(){//把状态改为提交
						$("#sbt").text("提交").unbind("click", updateFn);
						$("#logo").attr("src", "").hide();
						$("#job_name").val("");
						$("#company_name").val("");
						$("#job_exp").val("");
						$("#job_type").val("");
						$("#job_place").val("");
						$("#job_money").val("");
					})
					$("#sbt").on("click", sbtFn = function(){
						var re = checkSbt();//判断是否全部填入
						if(re.correct){//提交图片
							$.ajax({
								url: "/upload",
								type: "POST",
								dataType:"json",
								data: formdata,
								contentType: false, //发送信息到服务器的内容类型 告诉jq不要去设置Content-Type请求头,默认是 application/x-www-form-urlencoded （form类型） 
						        processData: false, //processData 是jq 独有的参数 用于对data参数进行序列化处理，默认值是true，
						                     //所谓序列化 就是比如{ width:1680, height:1050 }参数对象序列化为width=1680&height=1050这样的字符串。
							}).done(function(res){
								if(!res.code){
									$("#logo").show().attr("src", res.img).siblings("span").hide();//将路径改为服务器上的路径
									re = checkSbt();//在次调用更新图片的src
									$.post("/sbtJob", re.params, function(data){
										if(!data.code){
											$("#job").modal("hide");
											pages.curr = pages.counts;//添加一条数据后跳转到最后一页，显示出刚才添加的那条
											pages.sbt = true;
											loadFn(); 
											alert("添加成功！");
										}
									})
								}
							});
						}
						$(this).bind("click", updateFn);
					})

					function checkSbt(){//验证提交或者修改的输入
						var params = {};
						var inputArr = [$("#logo"), $("#job_name"), $("#company_name"), $("#job_exp") ,$("#job_type"), $("#job_place"), $("#job_money")];
						params.logo = inputArr[0].attr("src");
						params.jobName = inputArr[1].val();
						params.companyName = inputArr[2].val();
						params.jobExp = inputArr[3].val();
						params.jobType = inputArr[4].val();
						params.jobPlace = inputArr[5].val();
						params.jobMoney = inputArr[6].val();
						var i = 0, correct = true;
						for(var attr in params){
							if(!params[attr]){
								inputArr[i].siblings("span").text(inputArr[i].siblings("label").text()+"不能为空！").show();
								correct = false;
							}else{
								inputArr[i].siblings("span").hide();
							};
							inputArr[i].blur(function(){
								if($(this).val())
									$(this).siblings("span").hide();
							})
							i++;
						};
						return {correct, params};
					}

					// 删除指定item
					$("tbody").on("click", ".delete", function(){
						if(confirm("确认删除该条数据？")){
							var _id = $(this).parents("tr").data("id");
							var imgSrc = $(this).parent().siblings(".logo").children("img").attr("src");
							$.post("/deleteItem", {_id, imgSrc}, (data)=>{
								if(!data.code){
									$(this).parents("tr").remove();
									alert(data.msg);
									pages.del = true;
									loadFn();
								}
							})
						}
					})

					//修改
					var _update = null, oldImgSrc = null;
					$("tbody").on("click", ".update", function(){//点击修改获取修改的原内容
						_update = $(this);
						$("#sbt").text("确认修改").unbind("click", sbtFn);//状态改为修改
						var parent = $(this).parent();
						var logo = parent.siblings(".logo").find("img").attr("src"),
							jobName = parent.siblings(".jobName").text(),
							companyName = parent.siblings(".companyName").text(),
							jobExp = parent.siblings(".jobExp").text(),
							jobType = parent.siblings(".jobType").text(),
							jobPlace = parent.siblings(".jobPlace").text(),
							jobMoney = parent.siblings(".jobMoney").text();
						$("#logo").attr("src", logo).show();
						$("#job_name").val(jobName);
						$("#company_name").val(companyName);
						$("#job_exp").val(jobExp);
						$("#job_type").val(jobType);
						$("#job_place").val(jobPlace);
						$("#job_money").val(jobMoney);
						oldImgSrc = logo;
						checkSbt();//打开时隐藏所有sapn提示
					})
					//提交修改
					$("#sbt").on("click", updateFn = function(){
						var re = checkSbt();//上面的公用函数
						if(re.correct){
							$.ajax({
								url: "/upload",
								type: "POST",
								dataType:"json",
								data: formdata,
								contentType: false, //发送信息到服务器的内容类型 告诉jq不要去设置Content-Type请求头,默认是 application/x-www-form-urlencoded （form类型） 
						        processData: false, //processData 是jq 独有的参数 用于对data参数进行序列化处理，默认值是true，
						                     //所谓序列化 就是比如{ width:1680, height:1050 }参数对象序列化为width=1680&height=1050这样的字符串。
							}).done(function(res){
								if(!res.code){
									$("#logo").show().attr("src", res.img).siblings("span").hide();//将路径改为服务器上的路径
									re = checkSbt();
									re.params._id = _update.parents("tr").data("id");
									re.params.oldImgSrc = oldImgSrc;
									$.post("/updateItem", re.params, (data)=>{
										data.list[0].idx = _update.parent().siblings(".idx").text();
										var html = template("jobTemp", data);
										_update.parents("tr").replaceWith(html);
										$("#job").modal("hide");
									})
								}
							})
						}
						$(this).bind("click", sbtFn);
					})
				})
			}
		});
		
		

//register
		var u = false;//用户名不可用
		$("#username").blur(function(){
			var val = $(this).val();
			if(!val){
				$(this).siblings("span").show().text("用户名不能为空！").css({color:"red"});
				return;
			}
			$.post("/checkReg", {username: val}, (data)=>{
				if(data.code){
					u = false;
					$(this).siblings("span").show().text(data.msg).css({color:"red"});
				}else{
					u = true;
					$(this).siblings("span").show().text(data.msg).css({color:"green"});
				}
			})
		});

		var p = false;//密码不合法
		$("#pwd1").blur(function(){
			var val = $(this).val();
			if(/^\w{6,10}$/.test(val)){
				$(this).siblings("span").hide();
				p = true;
			}else{
				$(this).siblings("span").show();
				p = false;
			}
		});
		var p2 = false;//密码不一致
		$("#pwd2").blur(function(){
			var val = $(this).val();
			if(val && val === $("#pwd1").val()){
				$(this).siblings("span").hide();
				p2 = true;
			}else{
				$(this).siblings("span").show();
				p2 = false;
			}
		})

		var e = false;//邮箱不可用
		$("#email").blur(function(){
			var val = $(this).val();
			var regexp = /^([0-9A-Za-z\-_\.]+)@([0-9a-z]+\.[a-z]{2,3}(\.[a-z]{2})?)$/g;
			if(regexp.test(val)){
				$(this).siblings("span").hide();
				e = true;
			}else{
				$(this).siblings("span").show();
				e = false;
			}
		})

		
		//提交注册
		var promise = new Promise(function(resolve){
			$("#reg").click(function(){
				if(u && p && p2 && e){
					$.post("/register", {
						username: $("#username").val(),
						pwd: $("#pwd1").val(),
						email: $("#email").val()
					}, function(data){
						if(!data.code){
							resolve($("#username").val());
							$("#register").modal("hide");
							alert(data.msg);//注册成功
						}
					})
				}
			})
		})
		//注册成功后
		promise.then(function(name){
			$(".navfr .log").hide().siblings(".reg").hide();
			$(".navfr .name").show().children("a").text("你好，"+name);
			$(".navfr .quit").show();
			$.cookie("username", name);
			$(".job").show();
		});
		//注销登录
		$(".navfr .quit").click(function(){
			$(".navfr .log").show().siblings(".reg").show();
			$(".navfr .name").hide().siblings(".quit").hide();
			$.removeCookie("username");
			$("div.bginfo").show();
			$(".job").hide();
			return false;
		})

// login
		$("#log").click(function(){
			var name = $("#log_username").val();
			var pwd = $("#log_pwd").val();
			$.post("/login", {username: name, pwd}, function(data){
				if(data.code){
					if(data.code === 1){
						$("#log_username").siblings("span").text(data.msg).show();
						setTimeout(function(){
							$("#log_username").siblings("span").fadeOut();
						}, 2000)
					}else{
						$("#log_pwd").siblings("span").text(data.msg).show();
						setTimeout(function(){
							$("#log_pwd").siblings("span").fadeOut();
						}, 2000)
					}
				}else{
					$("#log_username").siblings("span").hide();
					$("#log_pwd").siblings("span").hide();
					$("#login").modal("hide");
					alert(data.msg);
					$(".navfr .log").hide().siblings(".reg").hide();
					$(".navfr .name").show().children("a").text("你好，"+name);
					$(".navfr .quit").show();
					$.cookie("username", name);
					$("div.bginfo").hide();
				}
			})
		})


	})
})