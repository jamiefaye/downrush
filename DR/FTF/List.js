let fileManagerHTML =`<html>
		<head>
			<title>FlashTools File Manager</title>
			<meta name="viewport" content="width=device-width">
			<meta charset="UTF-8">
			<script type="text/javascript" src="/DR/FTF/jquery-3.2.1.min.js"></script>
			<script type="text/javascript" src="/DR/FTF/uppie.js"></script>
			<script type="text/javascript" src="/DR/FTF/main.js"></script>
		</head>
		<style type="text/css">
			a { text-decoration: none; }
			table {
				/*border-collapse: collapse;*/
				border-collapse:separate;
			    width: 100%;
			}
			td {
				background-color: #F0F0F0;
				border: solid 1px #888888;
				color: black;
			}
			body {
 			   	margin: 0;
			}
			.table_name {
				/*width: 100px;*/
				position:relative;
				/* margin:0px auto 20px 50px; */
				color: #0000FF
			}
			.table_name a{
				position:absolute;
				top:0;
				left:0;
				width:100%;
				height:100%;
			}
			.table_sort a{
				position:absolute;
				top:0;
				left:0;
				width:100%;
				height:100%;
			}
			.table_bts {
				position:relative;
				/*margin:0px auto 20px;*/
			    text-align: center;
			}
			.table_bts a{
				position:absolute;
				top:0;
				left:0;
				width:100%;
				height:100%;
			}
			.table_eye {
				width: 2em;
				position:relative;
			    text-align: center;
			}
			.table_eye a {
				position:absolute;
				top:0;
				left:0;
				width:100%;
				height:100%;
			}
			.table_dts {
				width: 4em;
				position:relative;
				position:relative;
			    text-align: right;
			}
		
			.table_cmd {
				width: 2.5em;
				position:relative;
			    text-align: center;
			}
			.table_cmd a{
				position:absolute;
				top:0;
				left:0;
				width:100%;
				height:100%;
			}

			#uploader {
				background-color: #FFFFF0;
			}
			.bigger {
				font-size: 100%;
			}
	
			@media (max-width: 800px) {
				.wrapper {
					margin: 0 0 0 2px;
					width: 100%;
					word-wrap: break-word;
				}
			}
			@media (min-width: 800px) {
				.wrapper {
					margin: 0 0 0 2px;
					width: 800px;
					word-wrap: break-word;
				}
			}
 
		</style>
		<body>
			<div>
				<h2>Downrush File Manager</h2>
			</div>
			<div id="header">
				<h2>/</h2>
			</div>
			<hr>
			<div class="wrapper">
				<table id="filetable"></table>
			</div>
			<hr>
			<div id="reloadtime">
			</div>
			<a href="javascript:reload_list()">[Reload]</a><br>
			<input type="checkbox" id="FullFileList" value="0">Full File List(use Lua)</input>
			<hr>
			<div id="uploader">
				<form action="/upload.cgi" method="post" enctype="multipart/form-data" target="hogehogeFrame" >
					<input class='bigger' name="file" type="file" />
					<input class='bigger' type="submit" value="upload" onclick="return upload();" />
					<iframe src="about:blank" id="hogehogeFrame" name="hogehogeFrame" style="display:none;"></iframe>
				</form>
			<p>Drag and drop files and folders to upload here.<br><div id="statind"></div>
			</div>	
			<hr>
			<input class='bigger' type="button" value="New Directory" onclick="NewDirectory()">
			<input class='bigger' type="button" value="Remove All Files" onclick="RemoveAllFiles()">
			<hr>
	<script>
	uppie(document.querySelector('#uploader'), function (event, formData, files) {
	var flist = [];
	for (var [key, value] of formData.entries()) { if(key === 'files[]') flist.push(value); }
	uploadNext(flist);
});

</script>
<hr>
<div id="footer">
<a href="/~/Set.htm">FlashAir Settings</a><br>
<a href="/DR/Downrush.lua">Downrush Main Menu</a>
</div>
</body>
</html>`;
document.write(fileManagerHTML);