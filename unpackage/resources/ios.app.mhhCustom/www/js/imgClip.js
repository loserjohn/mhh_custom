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
	/*选择图片2 ke取消*/
	owner.getIMGPro = function(title, callback) {
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
			var fileSrc = e.files[0]
			//				压缩图片
				owner.zipPic(fileSrc,callback)
//			if(callback) callback(fileSrc);
		}, function(e) {
			plus.nativeUI.closeWaiting();
			console.log("取消选择图片");
		}, {
			filter: "image",
			multiple: true,
			maximum: 1,
			system: false,
			onmaxed: function() {
				plus.nativeUI.alert('最多只能选择' + num + '张图片');
			}
		});
	}
	/*拍照获取图片--  单张*/
	owner.cameraImages = function(callback) {
		var mobileCamera = plus.camera.getCamera(1);
		mobileCamera.captureImage(function(e) {
			plus.io.resolveLocalFileSystemURL(e, function(entry) {
				var path = entry.toLocalURL() 			
//				压缩图片
				owner.zipPic(path,callback)
//				if(callback) callback(path);
			}, function(err) {
				console.log("读取拍照文件错误");
			});
		}, function(e) {
			console.log( e);
		}, function() {
			filename: '_doc/' + new Date().getTime() + '.jpg';
		});
	}
//	压缩图片
	owner.zipPic= function(src,callback){
//		console.log('ZIP--'+src)
		plus.zip.compressImage({
				src: src,
				dst: '_doc/zip_' + src.substr(src.lastIndexOf('/') + 1),
				overwrite: true,
				quality: 100,
				format:'jpg'
			}, function(zip) {
				plus.nativeUI.closeWaiting();
				if(callback)(callback(zip.target))
			}, function() {
				plus.nativeUI.closeWaiting();
				mui.toast('压缩失败！');
			})
	}
	
	/*base64*/
	owner.getBase64Image = function(img) {
		var canvas = document.createElement("canvas"); //创建canvas DOM元素，并设置其宽高和图片一样
		canvas.width = img.width;
		canvas.height = img.height;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0, img.width, img.height); //使用画布画图
		var ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase(); //动态截取图片的格式
		var dataURL = canvas.toDataURL("image/jpg"); //返回的是一串Base64编码的URL并指定格式
		return dataURL;
	}

	owner.unpload64 = function(src, size, callback) {
		size = size || 1
		plus.nativeUI.showWaiting('图片上传中，请耐心等待');
		var Info = {
			image_base64: src,
			file_name: '.jpg',
			foldName: plus.storage.getItem('userName'),
			size: size
		}

		mui.ajax(owner.baseUrl + '/api/Upload/UploadByBase64', {
			data: Info,
			// dataType:'json',//服务器返回json格式数据
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
			error: function(xhr, type, errorThrown) {
				plus.nativeUI.closeWaiting();
				plus.nativeUI.toast('网络不稳定，请重新上传')
			}
		})
	}

}(window.Clip = {}));