(function(owner) {　

	owner.baseUrl = "https://mobile.mhh999.com"

	//	owner.pro = document.getElementById('versionTxt')
	//	owner.mask = document.getElementById('version')
	//		记录当前的版本信息
	owner.versionMsg = '';
	owner.LaunchWebview = null;
	owner.update = null;
	//1是不需要更新
	//2是整包更新
	//3是差量包升级

	//***************** 系统更新   ***************************
	//当前版本信息
	owner.versionInit = function(callback) {
		owner.LaunchWebview = plus.webview.getLaunchWebview()
		owner.update = plus.webview.create('./updating.html', 'updating')
		plus.runtime.getProperty(plus.runtime.appid, function(inf) {
			owner.wgtVer = inf.version;
			var checkUrl = owner.baseUrl + "/api/Update/Check";
			//	    检查版本	    
			owner.checkUpdate(checkUrl, owner.wgtVer, callback);
		});
	}

	// 判断版本信息
	owner.checkUpdate = function(checkUrl, curversion, callback) {
		//		plus.nativeUI.showWaiting("检测更新...");
		var xhr = new XMLHttpRequest();

		xhr.onreadystatechange = function() {
			switch(xhr.readyState) {
				case 4:
					plus.nativeUI.closeWaiting();
					if(xhr.status == 200) {
						//						console.log(xhr.responseText)
						owner.versionMsg = JSON.parse(xhr.responseText).Data;
						if(!JSON.parse(xhr.responseText).Success) {
							//							没有最新版本
							if(callback) callback(true)
							return;
						} else {
							var newVer = owner.versionMsg.version;
							// 有更新包
							owner.checkSystem(callback)
						}
					} else {}
					break;
				default:
					break;
			}
		}

		xhr.open('GET', checkUrl + '?version=' + curversion + '&type=' + 1, true);
		xhr.setRequestHeader("content-type", "application/json");

		xhr.send();
	}

	//系统检测
	owner.checkSystem = function(callback) {
		
		if(plus.os.name == 'Android') { // Android 用户    
			　　　　　　
			if(owner.versionMsg.Android == 1) {
				if(callback) callback(true) //可以调用自动登陆
				return false;
			} else if(owner.versionMsg.Android == 2) {
				plus.nativeUI.confirm("发现新版本,立即升级", function(e) {
					if(e.index == 0) {
						owner.createDownload();
					} else {
						if(callback) callback(true)
					}
				}, '马嘿嘿提醒你');
			} else {
				owner.downWgt(1);
			}
		} else {
			if(owner.versionMsg.iOS == 1) {
				if(callback) callback(true) //可以调用自动登陆   
				return false;
			} else if(owner.versionMsg.iOS == 2) {
				plus.nativeUI.confirm("发现新版本,立即前往AppStore", function(e) {
					if(e.index == 0) {
						plus.runtime.openURL(owner.versionMsg.ipaURL);
					} else {
						if(callback) callback(true)
					}
				}, '马嘿嘿提醒你');
			} else {
				owner.downWgt(2);
			}
		}
	}

	//服务器直接下载安卓整包
	owner.createDownload = function() {
		//		alert(owner.versionMsg.apkURL)
		var dtask = plus.downloader.createDownload(owner.versionMsg.apkURL, {
			filename: '_doc/download/'
		}, function(d, status) {
			// 下载完成
			if(status == 200) {
				plus.runtime.install(d.filename, {}, function(widgetInfo) {}, function(DOMException) {});
			} else {
				alert("更新失败");
			}
		});
		dtask.start();
	}

	//	下载差量升级包		
	owner.downWgt = function(key) {
		
		// 下载wgt文件
		var wgtUrl;
		switch(key) {
			case 1:
				wgtUrl = owner.versionMsg.apkURL;
				break;
			case 2:
				wgtUrl = owner.versionMsg.ipaURL;
				break;
			default:
				break;
		}

		//		alert(wgtUrl)
		var tasks = plus.downloader.createDownload(wgtUrl, {
			filename: "_doc/update/"
		}, function(d, status) {
			//			console.log(status)
			if(status == 200) {
				//				owner.mask.style.display = "none";
				//				owner.LaunchWebview.setStyle({
				//						mask: 'none'
				//					});
				owner.update.show()
			} else {
				plus.nativeUI.alert("下载升级文件失败！");
				//				owner.mask.style.display = "none";
				//				owner.LaunchWebview.setStyle({
				//						mask: 'none'
				//					});
				owner.update.show()
			}
		});

		tasks.addEventListener("statechanged", function(download, status) {
			switch(download.state) {
				case 2:
					owner.update.evalJS('text("已连接到服务器")')
					//					owner.mask.style.display = "block";
					//					owner.LaunchWebview.setStyle({
					//						mask: 'rgba(0,0,0,.7)'
					//					});
					owner.update.show()

					plus.nativeUI.toast("系统更新中,请稍后...");
					break;
				case 3:
					var percent = download.downloadedSize / download.totalSize * 100;
					//					owner.pro.innerText = "已下载 " + parseInt(percent) + "%";
					owner.update.evalJS('text("已下载' + parseInt(percent) + '%")')

					break;
				case 4:
					//					owner.pro.innerText = "下载完成";		
					owner.update.evalJS('text("下载完成")')
					if(plus.os.name == 'Android') {
						owner.installWgt(plus.io.convertLocalFileSystemURL(download.filename))
					} else {
						//						alert(download.filename)
						owner.installWgt(download.filename);
					}
					// 安装wgt包
					break;
			}
		});
		tasks.start();
	}

	//		安装差量升级包
	owner.installWgt = function(path) {
		plus.nativeUI.showWaiting("安装升级文件文件...");
		plus.runtime.install(path, {}, function() {
			plus.nativeUI.closeWaiting();
			//				console.log("安装升级文件文件成功！");
			plus.nativeUI.alert("应用资源更新完成！", function() {
				plus.runtime.restart();
			});
		}, function(e) {
			plus.nativeUI.closeWaiting();
			//				console.log("安装wgt文件失败[" + e.code + "]：" + e.message);
			plus.nativeUI.alert("安装wgt文件失败[" + e.code + "]：" + e.message);
			//			owner.mask.style.display = "none";
			//			owner.LaunchWebview.setStyle({
			//						mask: 'none'
			//					});
			owner.update.close()
		});
	}

}(window.systemOS = {}));