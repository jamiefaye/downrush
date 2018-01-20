arg_in = arg[1]
arg_in = arg_in:gsub("|"," ")

collectgarbage();
f = io.open(arg_in,"r")
if(f==nil) then
	print "HTTP/1.1 404 Not Found\nPragma: no-cache\nCache-Control: no-cache\n"
	print ("404 Not Found.");
	return
end

print "HTTP/1.1 200 OK\nPragma: no-cache\nCache-Control: no-cache\n"
collectgarbage();

--is W-04 4.00.01 or later?(print delay counterplan)
if(fa.serial)then
	i = 0
	buf=""
	for l in f:lines() do
		if(i<40)then
			buf = buf .. l .. "\x0A"
			i=i+1
		else
			buf = buf .. l
			print(buf)
			buf=""
			collectgarbage();
			i=0
		end
	end
	if(buf ~= "")then
		print(buf:sub(1,-2)) -- Cut out the last extra LF
	end
else
	--W-03
	for l in f:lines() do
		print(l)
		collectgarbage();
	end
end

f:close()
