if(debug == nil)then
	error("*Debug: Only works on W4.00.00")
end

require "/DR/tinybreakable"

arg_in = arg[1]
dol_pos = string.find(arg_in,"$",1,true)

fname = string.sub(arg_in,1,dol_pos-1)
arg[1] = string.sub(arg_in,dol_pos+1,-1)

dofile(fname)
