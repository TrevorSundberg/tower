sub Main()
try
TowerRun()
catch e
print "caught"
return
end try
throw "Expected trap"
end sub
