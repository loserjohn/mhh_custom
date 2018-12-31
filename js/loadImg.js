(function(owner) {
		owner.imgCache = function(src,callback) {
			// 1. 转换网络图片地址为本地缓存图片路径，判断该图片是否存在本地缓存
			// http://...jpg -> md5
			// 缓存目录 _downloads/image/(md5).jpg
			var image_url = src;
//			let image_md5 = md5(image_url);
			// 缓存本地图片url
			var  arr = src.split('/');
			var  LocalName= arr[arr.length-1].split('.')[0];				
//			var LocalName = arr[l.length -1]
			
//			console.log(src)
			
			var local_image_url = '_downloads/image/' + LocalName + '.jpg';
			// 平台绝对路径
			var absolute_image_path = plus.io.convertLocalFileSystemURL(local_image_url);
//			console.log(2,absolute_image_path);
			// 判断本地是否存在该文件，存在就就直接使用，否则就下载
			plus.io.resolveLocalFileSystemURL(local_image_url, function(entry) {
//				alert(1)
				if(entry) {
					console.log('存在',plus.io.convertLocalFileSystemURL(local_image_url));
//					return( plus.io.convertLocalFileSystemURL(local_image_url))
					if(callback)callback(plus.io.convertLocalFileSystemURL(local_image_url))
				} else {
					download_img();
				}
			}, function(e) {
				console.log("Resolve file URL failed: ");
				download_img();
			});

			function download_img() {
				// filename:下载任务在本地保存的文件路径
				let download_task = plus.downloader.createDownload(image_url, {
					filename: local_image_url
				}, function(download, status) {
					// 下载失败,删除本地临时文件
					if(status != 200) {
						console.log('下载失败,status' + status);
						if(local_image_url != null) {
							plus.io.resolveLocalFileSystemURL(local_image_url, function(entry) {
								entry.remove(function(entry) {
									console.log("临时文件删除成功" + local_image_url);
									// 重新下载图片
									download_img();
								}, function(e) {
									console.log("临时文件删除失败" + local_image_url);
								});
							});
						}
					} else {
						// 把下载成功的图片显示
						// 将本地URL路径转换成平台绝对路径
						console.log("下载成功" + local_image_url);
//						imgObj.image = plus.io.convertLocalFileSystemURL(local_image_url);
//						return(plus.io.convertLocalFileSystemURL(local_image_url))
if(callback)callback(plus.io.convertLocalFileSystemURL(local_image_url))
					}
				});
				download_task.start();
			}
		}

}(window.LocalImg = {}))