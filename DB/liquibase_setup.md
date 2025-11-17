### Install JAVA
```
sudo yum install java -y 
```
Downlaod and Install liquibase
```
sudo wget https://github.com/liquibase/liquibase/releases/download/v4.25.1/liquibase-4.25.1.tar.gz
sudo mkdir -p /opt/liquibase/
sudo tar -zxvf liquibase-4.25.1.tar.gz -C /opt/liquibase/
```
Setup liquibase
```
sudo vim /etc/profile.d/liquibase.sh
export PATH=$PATH:/opt/liquibase/
sudo chmod +x /etc/profile.d/liquibase.sh
source /etc/profile.d/liquibase.sh
```
Check liquibase Installed or Not
```
liquibase --version
```

## By default liquibase dont connect to your DB, we are using MYSQL so we need to download the MYSQl connector
### Download MYSQl connector
```
sudo mkdir -p /opt/mysql-connector/
sudo wget https://downloads.mysql.com/archives/get/p/3/file/mysql-connector-j-8.0.33.tar.gz
sudo tar -zxvf mysql-connector-j-8.0.33.tar.gz -C /opt/mysql-connector/
```
### Keep these MYSQL connector jar file in liquibase bin folder so that it will automatically use these connector 
```
sudo mv /opt/mysql-connector/mysql-connector-j-8.0.33.jar /opt/liquibase/lib/
```
# liquibase Command 
```
liquibase \
  --driver=com.mysql.cj.jdbc.Driver \
  --classpath=/opt/liquibase/lib/mysql-connector-j-8.0.33.jar \
  --url="jdbc:mysql://172.31.6.4:3306/AdminDB" \
  --username=dbadmin \
  --password='Admin@123' \
  --searchPath=/home/ec2-user/CPM/DB/liquibase \
  --changeLogFile=changelog-master.xml \
  update
```
liquibase need the master "changlog-file" so we need to menthon that PATH

Everytime using this big command is not easy, so we keep the "liquibase.properties" at PATh where master "changlog-file", so we need to place our 
"liquibase.properties"   in the same path

```
sudo vim /Path_toy_your_liquibase_changelog-master.xml_file/liquibase.properties
```
Place these Attributes
```
driver: com.mysql.cj.jdbc.Driver
classpath: /opt/liquibase/lib/mysql-connector-j-8.0.33.jar
url: jdbc:mysql://<DB-Private-IP>:3306/AdminDB
username: admin-DB-user
password: admin-DB-password
searchPath=/Path_toy_your_liquibase_changelog-master.xml_file/
changeLogFile=changelog-master.xml
```
### Now execute the liquibase Command 
```
liquibase update
```
When we execute these command these will check the master "changlog-file", using these master log file it will find and execute the version log file to update and matain the Db Changes
