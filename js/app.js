
(function(owner) {

	var holdTime; /* 免登时长 （ms）  一周*/ //判断忆否已经存在openid，没有则不自动登陆
	//	owner.holdTime = 60000;
	var opId; //最后的登陆时间

	var lastLoginTime; //	最后的登陆方式 1 为账号登陆,2为微信登陆

	var lastLoginWay; // 用户名

	var userName; // 用户密码	

	var userPass; // 计算距上次登陆的时间差

	var CryptoJS; //加密对象
	var auths = {} /* 授权登陆通道对象 */ //仅仅针对微信

	var authBtns = ['weixin'];
	owner.isIPhoneX = /iphone/gi.test(window.navigator.userAgent) && window.devicePixelRatio && window.devicePixelRatio === 3 && window.screen.width === 375 && window.screen.height === 812;
	mui.plusReady(function() {
		plus.runtime.setBadgeNumber(0);
		plus.navigator.setStatusBarStyle('light');
		holdTime = 604800000; /* 免登时长 （ms）  一周*/ //判断忆否已经存在openid，没有则不自动登陆
		opId = plus.storage.getItem('opId'); //最后的登陆时间

		lastLoginTime = plus.storage.getItem('lastLoginTime'); //	最后的登陆方式 1 为账号登陆,2为微信登陆

		lastLoginWay = plus.storage.getItem('lastLoginWay'); // 用户名

		userName = plus.storage.getItem('userName'); // 用户密码	

		userPass = plus.storage.getItem('userPass'); // 计算距上次登陆的时间差		
		plus.webview.currentWebview().setStyle({
			scrollIndicator: 'none'
		});
		//						获取微信免登的服务通道
		plus.oauth.getServices(function(services) {
			for(var i in services) {
				var service = services[i];
				//				console.log(service.id)
				if(service.id == 'weixin') {
					auths.s_name = 'weixin';
					auths.s_server = service;
					//					console.log(JSON.stringify(auths))
				}
			}
		}, function(e) {
			plus.nativeUI.toast("获取登录认证失败：" + e.message);
		});
	})

	//	console.log(CryptoJS)
	/* 域名 */
	//	owner.baseUrl = "http://192.168.1.6:8089/Data"
	//	owner.baseUrl = "http://mobile.mhh999.com"
//	发布环境
	owner.baseUrl = "https://mobile.mhh999.com"
//	测试环境
//	owner.baseUrl = "https://testmobile.mhh999.com"
	/* 初始化沉浸式导航栏 */
	owner.initHeader = function() {
		var isImmersedStatusbar = plus.navigator.isImmersedStatusbar();
		var StatusbarHeight = plus.navigator.getStatusbarHeight();

		var headerH = document.getElementById('header').offsetHeight;
		if(owner.isIPhoneX) {
			document.getElementById('header').style.height = headerH + 44 + 'px';
			document.getElementById('header').style.paddingTop = 44 + 'px';
			if(document.getElementById('content')) {
				document.getElementById('content').style.paddingTop = headerH + 44 + 'px';
			}
		} else {
			document.getElementById('header').style.height = headerH + StatusbarHeight + 'px';
			document.getElementById('header').style.paddingTop = StatusbarHeight + 'px';
			if(document.getElementById('content')) {
				document.getElementById('content').style.paddingTop = headerH + StatusbarHeight + 'px';
			}
		}

	}
	//***************用户登陆身份操作部分***************	
	/*传入加密对象*/
	owner.WXinit = function(obj) {
		CryptoJS = obj;

	}

	//	推送部分
	owner.pushInit = function() {
		var info = plus.push.getClientInfo();
		//		透传消息监听
		plus.push.addEventListener("receive", function(msg) {
			if(plus.os.name == "iOS") {
				if(msg.payload.indexOf('LocalMSG') >= 0) {
					//				收到的是本地消息
					//					alert('本地消息'+msg.payload)
					return
				} else {
					owner.createLocalPushMsg(msg);
				}
			} else {
				//				alert(JSON.stringify(msg))	

			}

			//				plus.nativeUI.alert(msg.content);
		}, false);
		//		点击消息监听
		plus.push.addEventListener("click", function(msg) {

			var MSG;
			if(plus.os.name == "iOS") {
				//			直接进入消息中心的消息
				if(typeof(msg.payload) == "string") {
					if(msg.payload.indexOf('LocalMSG') >= 0) {
						//				收到的是本地消息
						//				alert('本地消息'+msg.payload)
						var pl = msg.payload.split('@')[1];
						mui.later(function() {
							owner._jump(pl)
						}, 1000)

						return
					}
					MSG = JSON.parse(msg.payload)
				} else {
					//				alert(2)
					MSG = msg.payload
				}
				MSG = MSG.payload
				//			alert(MSG)
				if(!MSG) {
					mui.openWindow({
						url: './html/information/sysMessage.html',
						id: 'sysMessage',
						styles: {
							top: '0px', //新页面顶部位置
							bottom: '0px', //新页面底部位置
							scrollIndicator: "none",
							plusrequire: 'ahead',
							// 窗口参数 参考5+规范中的WebviewStyle,也就是说WebviewStyle下的参数都可以在此设置
							titleNView: { // 窗口的标题栏控件
								autoBackButton: true, // 标题栏文字,当不设置此属性时，默认加载当前页面的标题，并自动更新页面的标题
								titleColor: "#fff", // 字体颜色,颜色值格式为"#RRGGBB",默认值为"#000000"
								titleSize: "14px", // 字体大小,默认17px
								backgroundColor: "#151515", // 控件背景颜色,颜色值格式为"#RRGGBB",默认值为"#F7F7F7"
								progress: { // 标题栏控件的进度条样式
									color: "#ccaa42", // 进度条颜色,默认值为"#00FF00"  
									height: "2px" // 进度条高度,默认值为"2px"         
								},
								splitLine: { // 标题栏控件的底部分割线，类似borderBottom
									color: "#404040", // 分割线颜色,默认值为"#CCCCCC"  
									height: "1px" // 分割线高度,默认值为"2px"
								}
							}
						},
						show: {
							autoShow: true, //页面loaded事件发生后自动显示，默认为true
							duration: 300 //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
						},
						extras: {},
						waiting: {
							autoShow: true, //自动显示等待框，默认为true
							title: '正在加载...', //等待对话框上显示的提示内容
						}
					})
				} else {
					owner._jump(MSG)
				}
			} else {
				//				alert(msg.payload)
				mui.later(function() {
					owner._jump(msg.payload)
				}, 1000)
			}
		}, false);　
	}
	//	创建本地消息
	owner.createLocalPushMsg = function(msg) {
		var options = {
			cover: false
		};
		plus.push.createMessage(msg.content, "LocalMSG@" + msg.payload, options);
	}

	/**
	 * 用户自动登录
	 **/
	owner.autoLogin = function(callback) {

		var time;
		if(!lastLoginWay || !lastLoginTime) {

			if(callback) callback(false)
			return;
		}
		time = new Date().getTime() - parseInt(lastLoginTime);
		/*判断登陆方式*/

		switch(lastLoginWay) {
			/* 最后的登陆方式               1 为账号登陆 */
			case '1':
				//											alert('账号登陆')
				//	判断是否过期
				if(!userName || !userPass) return;

				if(time && time <= holdTime) {
					//								alert('未过期')
					/* 未过期 */
					owner._toMain(1, callback)
				} else {
					/* 过期 */
					//					alert('过期')
					mui.toast('账号密码过期,请手动登陆');
				}
				break;
			case '2':
				//											alert('微信登陆')
				/* 2为微信登陆
				判断是否过期 */
				if(!opId) return;
				if(time <= holdTime) {
					/* 未过期 */
					//					alert('未过期')
					owner._toMain(2, callback);
				} else {
					//					alert('过期')
					/* 不存在则重新登陆 */
					//					var time = setInterval(function() {
					//						if(!auths.s_server) return;
					//						owner.reWxLogin(callback);
					//						clearInterval(time);
					//					}, 200)
				}
				break;
			default:
				break;
		}

	}
	/*微信重新调用授权 自动登陆*/
	owner.reWxLogin = function(callback) {
		var auth = auths.s_server;
		plus.nativeUI.showWaiting();
		if(auth.authResult && auth.userInfo && plus.storage.getItem('opId')) {
			// 已经授权
			plus.storage.setItem('opId', auth.userInfo.openid);
			plus.storage.setItem('lastLoginWay', '2');
			var t = new Date().getTime().toString();
			plus.storage.setItem('lastLoginTime', t.toString());
			plus.nativeUI.closeWaiting();
			owner._toMain(2, callback);
		} else {
			// 没有授权
			plus.nativeUI.closeWaiting();
			owner.wxOAuth(callback);
		}
	}
	/*微信授权*/
	owner.wxOAuth = function(callback) {
		//		alert('去授权')
		var times2 = setInterval(function() {
			if(!auths.s_server) return;
			//			console.log(auths)
			var auth = auths.s_server;
			//				alert(3)
			auth.login(function() {
				//				alert(33)
				plus.nativeUI.toast("登录认证成功");
				//				 alert("登录认证成功");
				auth.getUserInfo(function(e) {
					var result = e.target.authResult;
					var info = e.target.userInfo;
					plus.storage.setItem('opId', result.openid);
					plus.storage.setItem('pic_head', info.headimgurl);
					plus.storage.setItem('petname', info.nickname);
					var t = new Date().getTime().toString();
					/* 获取信息后等注销 */
					if(callback) {
						owner._toMain(2, callback)
					}
				}, function(e) {
					//					plus.nativeUI.toast("获取用户信息失败" + e.message);
					plus.nativeUI.closeWaiting();
					plus.nativeUI.toast("获取用户信息失败,请检查网络");
				});
			}, function(e) {
				plus.nativeUI.closeWaiting();
				plus.nativeUI.toast("登录认证失,请检查网络");
			});

			clearInterval(times2);
		}, 200)
	}
	/*直接使用本地密码账号登陆*/
	owner._toMain = function(type, callback) {
		var key = type;
		//		alert(2)
		switch(key) {
			case 1:
				//账号自动登陆
				//				var waiting = plus.nativeUI.showWaiting('身份校验中...');
				var rPass = plus.storage.getItem('userPass');
				var userName = plus.storage.getItem('userName');
				var data = {
					rpass: rPass,
					username: userName,
					password: owner._Encrypt(rPass),
					type: 1
				}
				/* 账号登陆 */
				owner.zhlogin(data, function(status, msg) {
					//					waiting.close();
					if(status) {

						if(callback) callback(true, msg)

					} else {
						//						plus.nativeUI.toast('登陆失败，请手动登陆')
					}
				})

				break;
			case 2:
				//			alert(2) 
				//微信账号自动登陆
				var opid = plus.storage.getItem('opId');
				//				console.log(opid)
				var data = {
					opid: opid,
					aseopid: owner._Encrypt(opid),
					type: 1
				}
				/* 微信登陆 */
				owner.wxlogin(data, function(status, msg) {
					if(status) {
						//						alert('用户存在')
						if(callback) callback(true)
					} else {
						//						alert('登陆失败')
						if(callback) callback(false, msg)
					}
				})
				break;
			default:
				break;
		}
	}

	/* 账号登陆 */
	owner.zhlogin = function(loginInfo, callback) {
		callback = callback || $.noop;
		var Info = {};
		Info.username = loginInfo.username || '';
		Info.password = loginInfo.password || '';
		Info.type = loginInfo.type || '';
		//		console.log('4########################')
		//		console.log(JSON.stringify(Info))
		mui.ajax(app.baseUrl + '/api/Authorize/Token', {
			data: Info,
			// dataType:'json',//服务器返回json格式数据
			type: 'post', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			success: function(result) {
				/*登陆成功*/
				if(result.Success) {
					// 储存本地 记录登陆时间
					plus.storage.setItem('userName', Info.username.toString());
					plus.storage.setItem('userPass', loginInfo.rpass);
					plus.storage.setItem('lastLoginWay', '1');
					plus.storage.setItem('isLogin', '1');

					var t = new Date().getTime().toString();
					plus.storage.setItem('lastLoginTime', t.toString());
					/* 储存有效token */
					plus.storage.setItem('token', result.Msg);

					if(result.Data) {
						/*验证码登陆,返回密码存储*/
						plus.storage.setItem('userPass', result.Data.toString());
					}
					//					if(result.DataExt) {
					//						/*储存token过期的时间*/
					//						plus.storage.setItem('tokenLife', result.DataExt);
					//						//						console.log(result.DataExt)
					//					}
					owner.postDevice() //发送uid --个推

					if(callback) callback(true, null)
				} else {
					/*验证失败*/
					if(callback) callback(false, result.Msg)

				}
			},
			error: function(xhr, type, errorThrown) {
				//异常处理；

				owner.catchErr(type)
			}
		});
	}
	/* 微信登陆 */
	owner.wxlogin = function(loginInfo, callback) {

		callback = callback || $.noop;
		var Info = {};
		Info.aesOpenid = loginInfo.aseopid || '';
		Info.type = loginInfo.type || '';

		mui.ajax(app.baseUrl + '/api/Authorize/OpenidToken', {
			data: Info,
			// dataType:'json',//服务器返回json格式数据
			type: 'post', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			success: function(result) {
				/*登陆成功*/
				//				console.log('555' + JSON.stringify(result))
				if(result.Success) {
					// 储存本地 记录登陆时间
					//					plus.storage.setItem('opId', loginInfo.opid);
					plus.storage.setItem('lastLoginWay', '2');
					var t = new Date().getTime().toString();
					plus.storage.setItem('lastLoginTime', t.toString());
					/* 储存有效token */
					plus.storage.setItem('token', result.Msg);
					plus.storage.setItem('isLogin', '1');

					//					if(result.DataExt) {
					//						/*储存token过期的时间*/
					//						plus.storage.setItem('tokenLife', result.DataExt);
					//						//						console.log(result.DataExt)
					//					}
					owner.postDevice() //发送uid --个推

					/*返回用户的状态码*/
					if(callback) callback(true, null)
				} else {
					/*验证失败*/
					if(callback) callback(false, result.Msg)

				}
			},
			error: function(xhr, type, errorThrown) {
				//异常处理；
				owner.catchErr(type)
			}
		});
	}
	//	发送cid
	owner.postDevice = function() {
		var info = plus.push.getClientInfo();
		var cid = info.clientid;
		var device;
		if(mui.os.ios) {
			device = 2
		} else {
			device = 1
		}

		mui.ajax(owner.baseUrl + '/api/MemberInfo/BandUserCid', {
			data: {
				cid: cid,
				deviceType: device
			},
			type: 'post', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': owner.mark + plus.storage.getItem('token')
			},
			success: function(result) {
				//				alert(cid)
			},
			error: function(error) {
				//				alert(error)
			}
		});
//		alert(0).
		//预加载页面,之前需要通过后台获取token
		app.ajax(app.baseUrl + '/api/MemberInfo/Ry_Token', {
			type: 'post', //HTTP请求类型
			success: function(result) {
				if(result.Success) {
//					alert(result.Msg)
					plus.storage.setItem('IMtoken', result.Msg);
					plus.storage.setItem('myId', result.Data)
//
					plus.webview.getWebviewById('orders').evalJS('refreshOrder()')
					plus.webview.getWebviewById('mine').evalJS('refresh(true)')
//					
//					plus.webview.getWebviewById('orders').reload()
//					plus.webview.getWebviewById('mine').reload()
				} else {
//					alert(result.Msg)
				}
			},
			error:function(){
//				alert(-1)
			}
		});

	}
	/*页面跳转*/
	var jumpPage = function(id) {
		mui.openWindow({
			url: './' + id + '.html',
			id: id,
			styles: {
				top: '0px', //新页面顶部位置
				bottom: '0px', //新页面底部位置
				scrollIndicator: "none",
				plusrequire: 'ahead'
			},
			show: {
				autoShow: true, //页面loaded事件发生后自动显示，默认为true
				duration: 300 //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
			},
			extras: {
				//自定义扩展参数，可以用来处理页面间传值  
			},
			waiting: {
				autoShow: false, //自动显示等待框，默认为true
				title: '正在加载...', //等待对话框上显示的提示内容
			}
		})
	}
	// 注册接口
	owner.registe = function(loginInfo, callback) {
		callback = callback || $.noop;
		var Info = {};
		Info.mobile = loginInfo.mobile || '';
		Info.password = loginInfo.aespassword || '';
		Info.validate = loginInfo.validate || '';
		Info.parent = loginInfo.parent || '';
		Info.type = loginInfo.type || '';
		Info.pic_head = loginInfo.pic_head || '';
		Info.petname = loginInfo.petname || '';
		Info.openid = loginInfo.aesopenid || '';
		//		console.log(JSON.stringify(Info))
		mui.ajax(app.baseUrl + '/api/Authorize/Registe', {
			data: Info,
			type: 'post', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			success: function(result) {
				plus.nativeUI.closeWaiting();
				/*登陆成功*/
				if(result.Success) {
					// 储存本地 记录登陆时间
					plus.storage.setItem('userName', Info.mobile.toString());
					plus.storage.setItem('userNickName', Info.mobile.toString());
					plus.storage.setItem('userPass', loginInfo.password);
					//					console.log(JSON.stringify( loginInfo.password))
					var t = new Date().getTime().toString();
					plus.storage.setItem('lastLoginTime', t);
					/*注册成功后直接登陆*/
					plus.nativeUI.toast('注册成功')

					if(callback) callback(true, null)
					/*直接登陆*/
				} else {
					/*验证失败*/
					plus.nativeUI.toast(result.Msg)
					if(callback) callback(false, result.Msg)

				}
			},
			error: function(xhr, type, errorThrown) {
				//异常处理；
				owner.catchErr(type)
			}
		});
	}
	/* 获取验证码 */
	owner.getValidate = function(phone, type, callback) {

		callback = callback || $.noop;
		var Info = {};
		Info.mobile = phone || '';
		Info.type = type || '';

		mui.ajax(app.baseUrl + '/api/Msg/SendVerificationCode', {
			data: Info,
			// dataType:'json',//服务器返回json格式数据
			type: 'post', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			success: function(result) {
				/*登陆成功*/
				if(result.Success) {
					// 储存本地 记录登陆时间							
					if(callback) callback(true, null)

				} else {
					/*验证失败*/
					if(callback) callback(false, result.Msg)
				}
			},
			error: function(xhr, type, errorThrown) {
				//异常处理；
				owner.catchErr(type, errorThrown);
			}
		});
	}

	owner._KEY = "/fjdmllfjdmllfjdmllfjdmllfjdmll/"
	owner._IV = "1234567890000000"
	owner.mark = "Bearer "
	//	***************通用函数****************
	/*手机校验*/
	owner.checkPhone = function(str) {
		var r = (/^1[34578]\d{9}$/.test(str))
		return r
	}
	/*银行卡校验*/
	owner.rightCard = function(str) {
		var reg = /^([1-9]{1})(\d{15}|\d{18})$/; // 以19位数字开头，以19位数字结尾 
		return reg.test(str)
	}
	/*选择图片*/
	owner.getIMG = function(title, callback) {

		if(mui.os.plus) {
			var a = [{
				title: '拍照'
			}, {
				title: '从手机相册选择'
			}];
			plus.nativeUI.actionSheet({
				title: title,
				cancel: '取消',
				buttons: a
			}, function(b) {

				switch(b.index) {
					case 0:
						break;
					case 1:
						//拍照 
						owner.cameraImages(function(src) {
							if(callback) callback(src);
						});

						break;
					case 2:
						//打开相册 
						owner.galleryImages(1, function(src) {
							if(callback) callback(src);
						});
					default:
						break;
				}
			}, false);
		}
	}
	/*从相册获取图片*/
	owner.galleryImages = function(num, callback) {
		// 从相册中选择图片
		plus.gallery.pick(function(e) {
			var fileSrc = e.files[0]
			//						alert(fileSrc)
			owner.uploadIMG64(fileSrc, function(src) {
				if(callback) callback(src);
			})
		}, function(e) {
			plus.nativeUI.closeWaiting();
			console.log("取消选择图片");
		}, {
			filter: "image",
			multiple: true,
			maximum: num,
			system: false,
			onmaxed: function() {
				plus.nativeUI.alert('最多只能选择' + num + '张图片');
			}
		});
	}
	/*拍照获取图片--  单张*/
	owner.cameraImages = function(callback) {

		var mobileCamera = plus.camera.getCamera();
		mobileCamera.captureImage(function(e) {
			plus.io.resolveLocalFileSystemURL(e, function(entry) {
				var path = entry.toLocalURL();
				owner.uploadIMG64(path, function(src) {
					if(callback) callback(src);
				})
			}, function(err) {
				console.log("读取拍照文件错误");
			});
		}, function(e) {
			console.log("er", err);
		}, function() {
			alert(2)
			filename: '_doc/head.png';
		});
	}

	/*图片上传*/
	owner.uploadIMG64 = function(src, callback) {
		plus.nativeUI.showWaiting();
		var img = new Image();
		owner.zipPic(src, function(dsrc) {
			img.src = dsrc;
			img.onload = function() {
				var r = owner.getBase64Image(img)
				var dstsrc = r.url
				var ext = r.ext

				var Info = {
					image_base64: dstsrc,
					file_name: '.jpg',
					foldName: plus.storage.getItem('userName'),
					size: 1,
					isPrj: false
				}
				//			console.log(dstsrc)
				mui.ajax(owner.baseUrl + '/api/Upload/UploadByBase64', {
					data: Info,
					dataType: 'json', //服务器返回json格式数据
					type: 'post', //HTTP请求类型
					timeout: 10000, //超时时间设置为10秒；
					headers: {
						'Content-Type': 'application/json'
					},
					success: function(result) {
						//					console.log(result.Data)
						if(callback) callback(result.Data);
//						mui.later(function() {
//							plus.nativeUI.closeWaiting();
//						}, 2500)
					},
					error: function(xhr, type, errorThrown) {
						plus.nativeUI.closeWaiting();
					}
				})
			}

		})

	}
	//	压缩图片
	owner.zipPic = function(src, callback) {
		//		console.log('ZIP--'+src)
		plus.zip.compressImage({
			src: src,
			dst: '_doc/zip_' + src.substr(src.lastIndexOf('/') + 1),
			overwrite: true,
			quality: 100,
			format: 'jpg'
		}, function(zip) {
//			plus.nativeUI.closeWaiting();
			if(callback)(callback(zip.target))
		}, function() {
//			plus.nativeUI.closeWaiting();
			mui.toast('压缩失败！');
		})
	}
	/*base64*/
	owner.getBase64Image = function(img) {
		var canvas = document.createElement("canvas"); //创建canvas DOM元素，并设置其宽高和图片一样
		var radio = img.width / img.height
		canvas.width = 1200;
		canvas.height = canvas.width / radio;

		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height); //使用画布画图
		var ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase(); //动态截取图片的格式
		var dataURL = canvas.toDataURL("image/" + ext); //返回的是一串Base64编码的URL并指定格式
		return {
			url: dataURL,
			ext: ext
		};
	}
	/*初始化app*/
	owner.resetViews = function() {
		var arr = ["home", "HBuilder", "community", "information", "manage"]

		var wvs = plus.webview.all();

		for(var i = 0; i < wvs.length; i++) {
			var item = wvs[i];

			if(arr.indexOf(item.id) < 0) {
				//					console.log(item.id)
				item.close();
			}
		}
	}
	/*封装mui.ajax*/
	owner.ajax = function(url, option,isCache) {
//		alert(owner.mark + plus.storage.getItem('token'))
		var curTime = new Date().getTime();
		var tokenLife = plus.storage.getItem('tokenLife');
		option.timeout = 5000;
		option.headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': owner.mark + plus.storage.getItem('token')
		}
		if(isCache){
			option.headers["Cache-Control"] = 'public'
		}
		option.error = function(xhr, type, errorThrown) {
			plus.nativeUI.closeWaiting()
			var l = document.getElementById('loader')
			if(l) {
				l.style.display = 'none'
			}
			if(type == 'timeout') {
				plus.nativeUI.toast('网络超时！请稍后重试')
			} else if(type == 'abort') {
				plus.nativeUI.toast('网络未连接');
			} else if(errorThrown == 'Unauthorized') {
				//				plus.nativeUI.toast('重新登陆中');
				owner.autoLogin()
			} else {
				plus.nativeUI.toast('未知错误');
			}
		}
		mui.ajax(url, option)
	}
	//	错误捕获
	owner.catchErr = function(xhr, type, errorThrown) {
		plus.nativeUI.closeWaiting()
		var l = document.getElementById('loader')
		if(l) {
			l.style.display = 'none'
		}
		if(type == 'timeout') {
			plus.nativeUI.toast('网络不佳');
		} else if(type == 'abort') {
			plus.webview.getLaunchWebview().evalJS('closeVersion()')
			plus.nativeUI.toast('网络未连接');

		}
	}
	/*加密函数*/
	owner._Encrypt = function(str) {
		str = str + '|.|' + new Date().getTime()
		var key = CryptoJS.enc.Utf8.parse(owner._KEY);
		var iv = CryptoJS.enc.Utf8.parse(owner._IV);
		var encrypted = '';
		var srcs = CryptoJS.enc.Utf8.parse(str);
		encrypted = CryptoJS.AES.encrypt(srcs, key, {
			iv: iv,
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7
		});
		return encrypted.ciphertext.toString();
	}

	owner._jump = function(str) {
		//		A 沉浸式导航栏  W 有导航栏  B 新闻详情  P项目  O是订单详情
//		console.log(str)
		if(!str) {
			return
		};
		var key = str.split('||')[0];
		var code = str.split('||')[1];
		if(!code) {
			return
		};
		switch(key) {
			case 'A':
				//								活动								
				mui.openWindow({
					url: code,
					id: 'activity' + new Date().getTime(),
					styles: {
						top: '0px', //新页面顶部位置
						bottom: '0px', //新页面底部位置
						scrollIndicator: "none",
						plusrequire: 'ahead',

						// 窗口参数 参考5+规范中的WebviewStyle,也就是说WebviewStyle下的参数都可以在此设置
						titleNView: { // 窗口的标题栏控件
							type: 'transparent',
							autoBackButton: true, // 标题栏文字,当不设置此属性时，默认加载当前页面的标题，并自动更新页面的标题
							titleColor: "#fff", // 字体颜色,颜色值格式为"#RRGGBB",默认值为"#000000"
							titleSize: "14px", // 字体大小,默认17px
							backgroundColor: "#ccaa42", // 控件背景颜色,颜色值格式为"#RRGGBB",默认值为"#F7F7F7"
							//							progress: { // 标题栏控件的进度条样式
							//								color: "#fff", // 进度条颜色,默认值为"#00FF00"  
							//								height: "2px" // 进度条高度,默认值为"2px"         
							//							},
							splitLine: { // 标题栏控件的底部分割线，类似borderBottom
								color: "#fff", // 分割线颜色,默认值为"#CCCCCC"  
								height: "1px" // 分割线高度,默认值为"2px"
							}
						}
					},
					createNew: true, //是否重复创建同样id的webview，默认为false:不重复创建，直接显示
					show: {
						autoShow: true, //页面loaded事件发生后自动显示，默认为true
						duration: 300 //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
					},
					extras: {
						//自定义扩展参数，可以用来处理页面间传值  
						detail: data
					},
					waiting: {
						autoShow: true, //自动显示等待框，默认为true
						title: '正在加载...', //等待对话框上显示的提示内容
					}
				})

				break;
			case 'W':
				//								外链
				mui.openWindow({
					url: code,
					id: 'activity' + new Date().getTime(),
					styles: {
						top: '0px', //新页面顶部位置
						bottom: '0px', //新页面底部位置
						scrollIndicator: "none",
						plusrequire: 'ahead',
						// 窗口参数 参考5+规范中的WebviewStyle,也就是说WebviewStyle下的参数都可以在此设置
						titleNView: { // 窗口的标题栏控件
							autoBackButton: true, // 标题栏文字,当不设置此属性时，默认加载当前页面的标题，并自动更新页面的标题
							titleColor: "#fff", // 字体颜色,颜色值格式为"#RRGGBB",默认值为"#000000"
							titleSize: "14px", // 字体大小,默认17px
							backgroundColor: "#151515", // 控件背景颜色,颜色值格式为"#RRGGBB",默认值为"#F7F7F7"
							progress: { // 标题栏控件的进度条样式
								color: "#ccaa42", // 进度条颜色,默认值为"#00FF00"  
								height: "2px" // 进度条高度,默认值为"2px"         
							},
							splitLine: { // 标题栏控件的底部分割线，类似borderBottom
								color: "#404040", // 分割线颜色,默认值为"#CCCCCC"  
								height: "1px" // 分割线高度,默认值为"2px"
							}
						}
					},
					createNew: true, //是否重复创建同样id的webview，默认为false:不重复创建，直接显示
					show: {
						autoShow: true, //页面loaded事件发生后自动显示，默认为true
						duration: 300 //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
					},
					extras: {
						//自定义扩展参数，可以用来处理页面间传值  
						detail: data
					},
					waiting: {
						autoShow: true, //自动显示等待框，默认为true
						title: '正在加载...', //等待对话框上显示的提示内容
					}
				})
				break;
			case 'B':
				//								社区新闻
				var data = {
					infoCode: code
				}
				mui.openWindow({
					url: './html/community_detail.html',
					id: 'community_detail',
					styles: {
						top: '0px', //新页面顶部位置
						bottom: '0px', //新页面底部位置
						scrollIndicator: "none",
						plusrequire: 'ahead',
						// 窗口参数 参考5+规范中的WebviewStyle,也就是说WebviewStyle下的参数都可以在此设置
						titleNView: { // 窗口的标题栏控件
							autoBackButton: true, // 标题栏文字,当不设置此属性时，默认加载当前页面的标题，并自动更新页面的标题
							titleColor: "#fff", // 字体颜色,颜色值格式为"#RRGGBB",默认值为"#000000"
							titleSize: "14px", // 字体大小,默认17px
							backgroundColor: "#151515", // 控件背景颜色,颜色值格式为"#RRGGBB",默认值为"#F7F7F7"
							progress: { // 标题栏控件的进度条样式
								color: "#ccaa42", // 进度条颜色,默认值为"#00FF00"  
								height: "2px" // 进度条高度,默认值为"2px"         
							},
							splitLine: { // 标题栏控件的底部分割线，类似borderBottom
								color: "#404040", // 分割线颜色,默认值为"#CCCCCC"  
								height: "1px" // 分割线高度,默认值为"2px"
							}
						}
					},
					createNew: true, //是否重复创建同样id的webview，默认为false:不重复创建，直接显示
					show: {
						autoShow: true, //页面loaded事件发生后自动显示，默认为true
						duration: 300 //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
					},
					extras: {
						//自定义扩展参数，可以用来处理页面间传值  
						detail: data
					},
					waiting: {
						autoShow: true, //自动显示等待框，默认为true
						title: '正在加载...', //等待对话框上显示的提示内容
					}
				})

				break;
			case 'P':
				//项目
				mui.openWindow({
					url: './html/production/productBuy.html',
					id: 'productBuy',
					styles: {
						top: '0px', //新页面顶部位置
						bottom: '0px', //新页面底部位置
						scrollIndicator: "none",
						plusrequire: 'ahead'
					},
					createNew: false, //是否重复创建同样id的webview，默认为false:不重复创建，直接显示
					show: {
						autoShow: true, //页面loaded事件发生后自动显示，默认为true
						duration: 300 //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
					},
					extras: {
						proKey: code
					},
					waiting: {
						autoShow: true, //自动显示等待框，默认为true
						title: '正在加载...', //等待对话框上显示的提示内容
					}
				})

				break;
			case 'O':
				//订单详情
				mui.openWindow({
					url: './html/order/orderDetail.html',
					id: 'orderDetail',
					styles: {
						top: '0px', //新页面顶部位置
						bottom: '0px', //新页面底部位置
						scrollIndicator: "none",
						plusrequire: 'ahead',
						titleNView: {
							autoBackButton: true, // 标题栏文字,当不设置此属性时，默认加载当前页面的标题，并自动更新页面的标题
							titleColor: "#fff", // 字体颜色,颜色值格式为"#RRGGBB",默认值为"#000000"
							titleSize: "14px", // 字体大小,默认17px
							backgroundColor: "#ccaa42", // 控件背景颜色,颜色值格式为"#RRGGBB",默认值为"#F7F7F7"
							progress: { // 标题栏控件的进度条样式
								color: "#fff", // 进度条颜色,默认值为"#00FF00"
								height: "2px" // 进度条高度,默认值为"2px"         
							},
							splitLine: { // 标题栏控件的底部分割线，类似borderBottom
								color: "#e6be65", // 分割线颜色,默认值为"#CCCCCC"  
								height: "1px" // 分割线高度,默认值为"2px"
							}
						}
					},
					createNew: true, //是否重复创建同样id的webview，默认为false:不重复创建，直接显示
					show: {
						autoShow: true, //页面loaded事件发生后自动显示，默认为true
						duration: 300 //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
					},
					extras: {
						//自定义扩展参数，可以用来处理页面间传值  
						orderId: code
					},
					waiting: {
						autoShow: true, //自动显示等待框，默认为true
						title: '正在加载...', //等待对话框上显示的提示内容
					}
				})

				break;
			default:
				break;
		}
	}
	/*日期转化*/
	owner.dateFormate = function(date) {
		var y = date.getFullYear();
		var m = date.getMonth() + 1;
		m = m < 10 ? ('0' + m) : m;
		var d = date.getDate();
		d = d < 10 ? ('0' + d) : d;
		var h = date.getHours();
		h = h < 10 ? ('0' + h) : h;
		var minute = date.getMinutes();
		minute = minute < 10 ? ('0' + minute) : minute;
		var second = date.getSeconds();
		second = second < 10 ? ('0' + second) : second;
		return y + '-' + m + '-' + d + ' ' + h + ':' + minute;
	}

	owner.navigater = function(dstUrl, dstId, extras, option) {
		extras = extras || {};
		//		跳转参数
		var def = {
			showTitle: option.showTitle ? option.showTitle : false, //是否显示先生的导航栏
			autoShow: option.autoShow===false? option.autoShow : true, //是否自动显示
			autoWaiting: option.autoWaiting ===false? option.autoWaiting : true, //是否显示菊花
			createNew: option.createNew ? option.createNew : false,
			title_bacground: option.title_bacground ? option.title_bacground : '#151515', //默认的导航背景色
			title_color: option.title_color ? option.title_color : "#fff",
			progress_color: option.progress_color ? option.progress_color : "#ccaa42",
			splitLine_color: option.splitLine_color ? option.splitLine_color : "#404040"
		}

		var style = {
			top: '0px', //新页面顶部位置
			bottom: '0px', //新页面底部位置
			scrollIndicator: "none",
			plusrequire: 'ahead',
		}

		if(def.showTitle) {
			//			设置显示原生导航栏
			style = {
				top: '0px', //新页面顶部位置
				bottom: '0px', //新页面底部位置
				scrollIndicator: "none",
				plusrequire: 'ahead',
				// 窗口参数 参考5+规范中的WebviewStyle,也就是说WebviewStyle下的参数都可以在此设置
				titleNView: { // 窗口的标题栏控件
					autoBackButton: true, // 标题栏文字,当不设置此属性时，默认加载当前页面的标题，并自动更新页面的标题
					titleColor: def.title_color, // 字体颜色,颜色值格式为"#RRGGBB",默认值为"#000000"
					titleSize: "14px", // 字体大小,默认17px
					backgroundColor: def.title_bacground, // 控件背景颜色,颜色值格式为"#RRGGBB",默认值为"#F7F7F7"
					progress: { // 标题栏控件的进度条样式
						color: def.progress_color, // 进度条颜色,默认值为"#00FF00"  
						height: "2px" // 进度条高度,默认值为"2px"         
					},
					splitLine: { // 标题栏控件的底部分割线，类似borderBottom
						color: def.splitLine_color, // 分割线颜色,默认值为"#CCCCCC"  
						height: "1px" // 分割线高度,默认值为"2px"
					}
				}
			}
		}
				
		mui.openWindow({
			url: dstUrl,
			id: dstId,
			styles: style,
			createNew: def.createNew, //是否重复创建同样id的webview，默认为false:不重复创建，直接显示
			show: {
				autoShow: def.autoShow, //页面loaded事件发生后自动显示，默认为true
				duration: 300 //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
			},
			extras: extras,
			waiting: {
				autoShow: def.autoWaiting, //自动显示等待框，默认为true
				title: '正在加载...', //等待对话框上显示的提示内容
			}
		})
	}

}(window.app = {}));


(function(com){ 
     
    var hashCode = function(str) { 
        var hash = 0; 
        if (!str || str.length == 0) return hash; 
        for (i = 0; i < str.length; i++) { 
            char = str.charCodeAt(i); 
            hash = ((hash << 5) - hash) + char; 
            hash = hash & hash; // Convert to 32bit integer 
        } 
        return hash; 
    }; 
    com.hashCode=hashCode; 
    /** 
     *存储当前下载路径www.bcty365.com
     */ 
    var cache = {}; 
    cache.getFile = function(netPath, cb) { 
        var filePathCache = getLocalFileCache(netPath); 
        if (filePathCache) { 
            return cb(filePathCache); 
        } else { 
            Filedownload(netPath, function(localPath) { 
                return cb(localPath); 
            }); 
        } 
    }; 
 
    //下载 
    var Filedownload = function(netPath, callback) { 
        var dtask = plus.downloader.createDownload(netPath, {}, function(d, status) { 
            // 下载完成 
            if (status == 200) { 
                plus.io.resolveLocalFileSystemURL(d.filename, function(entry) { 
                    setLocalFileCache(netPath, entry.toLocalURL()); 
                    callback(entry.toLocalURL()); //获取当前下载路径 
                }); 
            } 
        }); 
        dtask.start(); 
    }; 
 
    function getLocalFileCache(netPath) { 
        var FILE_CACHE_KEY = "filePathCache_" + common.hashCode(netPath); 
        var localUrlObj = plus.storage.getItem(FILE_CACHE_KEY); 
        return localUrlObj; 
    } 
 
    function setLocalFileCache(netPath, localPath) { 
        var FILE_CACHE_KEY = "filePathCache_" + common.hashCode(netPath); 
        plus.storage.setItem(FILE_CACHE_KEY, localPath); 
    } 
 
    com.cache = cache; 
}(window.common={})) 


