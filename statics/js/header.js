$(function(){
	$.cookie.json = true;
		//获取cookie name
	var name = $.cookie("username");
	if(name){
		$(".navfr .log").hide().siblings(".reg").hide();
		$(".navfr .name").show().children("a").text("你好，"+name);
		$(".navfr .quit").show();
	}
})