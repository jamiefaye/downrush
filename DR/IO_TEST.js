
		var xhr = new XMLHttpRequest(); //手動用
		var xhr2 = new XMLHttpRequest(); //自動用
		var return_func = null;
		var CTRL_HEX="0x00";
		var DATA_HEX="0x00";

//-----------
		var readme = false;
		function view_read()
		{
			if(readme)
			{
				document.getElementById("readme").style.display="none";
				readme=false;
			}else{
				document.getElementById("readme").style.display="block";
				readme=true;
			}
		}
//-----------
		var pinass = false;
		function view_pin()
		{
			if(pinass)
			{
				document.getElementById("pi_ass").style.display="none";
				pinass=false;
			}else{
				document.getElementById("pi_ass").style.display="block";
				pinass=true;
			}
		}
//-----------
		var lis = false;
		function view_ls()
		{
			if(lis)
			{
				document.getElementById("license").style.display="none";
				lis=false;
			}else{
				document.getElementById("license").style.display="block";
				lis=true;
			}
		}
//-----------
		function renew_get_2()
		{
				renew();
				renew_get();
		}

		function renew_get()
		{
			if(document.ctrl.en.checked == 0){
				timer2 = setTimeout('renew_get()',500);
				return;
			}
			
			URL = "/command.cgi?op=190&CTRL=0x"+CTRL_HEX+"&DATA=0x"+DATA_HEX
			xhr2.open("GET" , URL);
			xhr2.send();
			timer2 = xhr2_wait_set(gotIOinfo2);
		}
		
		function renew()
		{
			var CTRL=0
			for(var i=0 ; i<5 ; i++){
				var obj = eval("document.tris.T" + i);
				if(obj.checked)	{
					CTRL += Number(obj.value);
				}
			}

			var DATA=0
			for(var i=0 ; i<5 ; i++){
				var obj = eval("document.stat.S" + i);
				if(obj.checked)	{
					DATA += Number(obj.value);
				}
			}

			if(CTRL < 16) {
				CTRL_HEX = "0"+CTRL.toString(16)
			}else{
				CTRL_HEX = CTRL.toString(16)				
			}
			
			if(DATA < 16) {
				DATA_HEX = "0"+DATA.toString(16)
			}else{
				DATA_HEX = DATA.toString(16)				
			}
			
			URL = "/command.cgi?op=190&CTRL=0x"+CTRL_HEX+"&DATA=0x"+DATA_HEX
			//show(URL);
			xhr.open("GET" , URL);
			xhr.send();
			xhr_wait_set(gotIOinfo);
		}
		
		function gotIOinfo()
		{
			//show(xhr.responseText);
			var obj = JSON.parse(xhr.responseText);
			show(obj.STATUS+"/"+obj.CTRL + "/" + obj.DATA);
			
			var DATA =	parseInt(obj.DATA,16);
			for(var i=0 ; i<5 ; i++){
				var obj_ch = eval("document.stat.S" + i);
				obj_ch.checked = ((DATA&(1<<i)) != 0);
			}
				
			if(obj.STATUS == "CONFIGERR"){
				show("IOポート機能が無効です。セットアップを実行してください<br>Error:IFMODE is not 1.  Please setup.")
			}
		}

		function gotIOinfo2()
		{
			//show(xhr.responseText);
			var obj = JSON.parse(xhr2.responseText);
			show(obj.STATUS+"/"+obj.CTRL + "/" + obj.DATA);
			
			var DATA =	parseInt(obj.DATA,16);
			for(var i=0 ; i<5 ; i++){
				var obj_ch = eval("document.stat.S" + i);
				obj_ch.checked = ((DATA&(1<<i)) != 0);
			}
			if(obj.STATUS == "CONFIGERR"){
				show("IOポート機能が無効です。セットアップを実行してください<br>Error:IFMODE is not 1.  Please setup.")
			}
//			timer2 = setTimeout('renew_get()',100);
		}

		function show(x)
		{
			document.getElementById( "status" ).innerHTML	= x;
		}
		
		function xhr_wait_set(x)
		{
			return_func = x;
			timer1 = setTimeout('xhr_wait()',100);	
		}
		function xhr_wait()
		{
			if(xhr.readyState == 4)
			{
				if(xhr.status == 0){
					show("connection Error.");
					return -1;
				}
				if(xhr.status < 200 && xhr.status > 300){ //!=2XX
					show("Server Error. CODE:"+xhr.status);
					return -1;
				}
				//show("done.");
				return_func();
				return 0;
			}else{
				timer1 = setTimeout('xhr_wait()',100);
				return 1;
			}
		}


		function xhr2_wait_set(x)
		{
			return_func = x;
			timer2 = setTimeout('xhr2_wait()',100);	
		}
		function xhr2_wait()
		{
			if(xhr2.readyState == 4)
			{
				if(xhr2.status == 0){
					show("connection Error.");
					return -1;
				}
				if(xhr2.status < 200 && xhr2.status > 300){ //!=2XX
					show("Server Error. CODE:"+xhr2.status);
					return -1;
				}
				show("done.");
				timer2 = setTimeout('renew_get()',500);
				return_func();
				return 0;
			}else{
				timer2 = setTimeout('xhr2_wait()',100);
				return 1;
			}
		}
		
		renew_get();//自動取得開始
		//timer3 = setInterval('renew_get()',100); //自動取得開始
