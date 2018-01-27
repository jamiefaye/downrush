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
			#header {
				font-size: 14pt;
			}
			.tab_check {
				width: 1em;
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
			.nobord * {
				border: none;
				background-color: white;
				width: auto;
			}

			#uploader {
				background-color: #FFFFF0;
			}

			.tinygap {
			font-size: 2pt;
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
			<div id="header">
				
			</div>
			<hr>
			<div class="wrapper">
				<table id="filetable"></table>
			</div>

			<div id="uploader">
				<form action="/upload.cgi" method="post" enctype="multipart/form-data" target="hogehogeFrame" >
					<input name="file" type="file" />
					<input type="submit" value="upload" onclick="return upload();" />
					<iframe src="about:blank" id="hogehogeFrame" name="hogehogeFrame" style="display:none;"></iframe>
				</form>
			<br>Drag and drop files and folders to upload here.<br><div id="statind"></div>
			</div>
			<input type="button" value="New Directory" onclick="NewDirectory()">
			<input type="button" value="Remove Checked Files" onclick="deleteFiles()">
			<input type="button" value="Rename Checked File" onclick="renameFile()">
			<hr>
						<div class = 'nobord'>
			<table class='nobord'><tr>
			<td><div id="reloadtime"></div></td>
			<td><a href="javascript:reload_list()">[Reload]</a></td>
			<td><input type="checkbox" id="FullFileList" value="0">Show Hiddens</input></td>
				<td><a style='text-decoration: underline' href="/~/Set.htm">Configuration Menu</a></td>
		</tr></table></div>
	<script>
	uppie(document.querySelector('#uploader'), function (event, formData, files) {
	var flist = [];
	for (var [key, value] of formData.entries()) { if(key === 'files[]') flist.push(value); }
	uploadNext(flist);
});

</script>

</body>
</html>`;
document.write(fileManagerHTML);