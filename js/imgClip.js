
//需要剪裁类型
(function(owner) {
	owner.baseUrl = "https://mobile.mhh999.com"
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

						break;
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
			for(var i in e.files) {
				var fileSrc = e.files[i]
//				owner.uploadIMG(fileSrc, function(src) {
					if(callback) callback(fileSrc);
//				})
			}
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
				var path = entry.toLocalURL() + '?version=' + new Date().getTime();
//				owner.uploadIMG(path, function(src) {
					if(callback) callback(path);
//				})
			}, function(err) {
				console.log("读取拍照文件错误");
			});
		}, function(e) {
			console.log("er", err);
		}, function() {
			filename: '_doc/head.png';
		});
	}
	/*图片上传*/
	owner.uploadIMG = function(src,callback) {
		
		var img = new Image();
		img.src = src;
		plus.nativeUI.showWaiting();
		var url = owner.baseUrl + '/api/Upload/UploadImage';
		var task = plus.uploader.createUpload(url, {
				method: "POST"
			},
			function(t, status) { //上传完成
				if(status == 200) {
					var res = JSON.parse(t.responseText)
					//		            	console.log(res.Data)
					if(callback) callback(res.Data);
					mui.later(function() {
						plus.nativeUI.closeWaiting();
					}, 1500)

				} else {
					console.log("上传失败：" + status);
				}
			}
		);
		var foldName = plus.storage.getItem('userName')
		//添加其他参数
		task.addData("foldName", foldName);
		task.addFile(src, {
			key: src
		});
		task.start();
	}
	/*base64*/
	owner.getBase64Image = function(img) {
		var canvas = document.createElement("canvas"); //创建canvas DOM元素，并设置其宽高和图片一样
		canvas.width = img.width;
		canvas.height = img.height;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0, img.width, img.height); //使用画布画图
		var ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase(); //动态截取图片的格式
		var dataURL = canvas.toDataURL("image/" + ext); //返回的是一串Base64编码的URL并指定格式
		return dataURL;
	}
   
   owner.unpload64 = function(src,size,callback){
   		size = size || 3
   		plus.nativeUI.showWaiting();
		var Info = {
			image_base64:src,
			file_name:'.png',
			foldName:plus.storage.getItem('userName'),
			size:size
		}
   		mui.ajax(owner.baseUrl + '/api/Upload/UploadByBase64', {
			data: Info,
			 dataType:'json',//服务器返回json格式数据
			type: 'post', //HTTP请求类型
			timeout: 10000, //超时时间设置为10秒；
			headers: {
				'Content-Type': 'application/json'
			},
			success: function(result) {
				if(callback) callback(result.Data);
					mui.later(function() {
						plus.nativeUI.closeWaiting();
				}, 1500)
			},
			error:function(xhr, type, errorThrown){
				plus.nativeUI.closeWaiting();
//				alert(type)
			}
		})
   }


}(window.Clip = {}));