print "HTTP/1.1 200 OK"
print "Cache-Control: private, no-store, no-cache, must-revalidate"
print ""

if(arg[1] == nill)then
	print("Path not found")
	return
end
if(arg[2] == nill)then
	print("Path not found")
	return
end

local path = string.match(arg[1],"([^%c]+)")
local path2 = string.match(arg[2],"([^%c]+)")
if(path == nill)then
	print("Path not found")
	return
end
if(path2 == nill)then
	print("Path not found")
	return
end

path = path:gsub("|"," ")
path2 = path2:gsub("|"," ")


fa.rename(path,path2)
print("Done")
