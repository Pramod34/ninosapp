clear


echo "Started Running script... Please wait..."
echo "Creating mongodb databases and creating users in it..."


mongo localhost:27017 <<EOF

use admin
db.createUser({user:"sa", pwd:"D0cum3ntum", roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]})

quit()
EOF

echo "Created databases and added users to it successfully."
echo "Enjoy have a nice day :)"
echo "Bye!"