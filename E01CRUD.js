const http=require("http");
const url=require("url");
const querystring=require("querystring");
const fs=require("fs/promises");
const mysql2=require("mysql2");
const pug=require("pug");

const server=http.createServer();
server.listen(8889,()=>{
    console.log("http://localhost:8889");
})

const mysqlConInfo={
    host:"localhost",
    port:"3306",
    user:"root",
    password:"mysql123",
    database:"scott"
}

const creatPool=mysql2.createPool(mysqlConInfo);
const pool=creatPool.promise();

server.on("request",async (req,res)=>{
    res.setHeader("content-type","text/html;charset=utf-8;");
    const urlObj=url.parse(req.url);
    const params=querystring.parse((urlObj.query));
    const urlSplist=urlObj.pathname.split("/");
    if(urlSplist[1]==="public") {
        if (urlSplist[2] === "js") {
            res.setHeader("content-type", "application/javascript");
        } else if (urlSplist[2] === "css") {
            res.setHeader("content-type", "text/css");
        } else if (urlSplist[2] === "image") {
            res.setHeader("content-type", "image/jpeg");
        }
        try{
           let data= await fs.readFile("."+urlObj.pathname);
           res.write(data);
           res.end();
        }catch (e) {
            console.error(e)
        }
    }else {
        if(urlObj.pathname==="/"){
            const html=pug.renderFile("./templates/deptIndex.pug");
            res.write(html);
            res.end();
        }else if(urlObj.pathname==="/deptList.do"){
            try {
                const [rows,f]= await pool.query("SELECT * FROM DEPT");

                let html=pug.renderFile("./templates/deptList.pug",{deptList:rows});
                res.write(html);
                res.end();
            }catch (e) {
                console.error(e)
            }
        }else if(urlObj.pathname==="/deptDetail.do"){
            let deptno=Number(params.deptno);

            if (Number.isNaN(deptno)){
                errMsg();
                return;
            }
            let sql="SELECT * FROM DEPT WHERE DEPTNO=?";
            const [rows,fields]=await pool.query(sql,[deptno]);
            const html=pug.renderFile("./templates/deptDetail.pug",{dept:rows[0]})
            res.write(html);
            res.end();
        }else if(urlObj.pathname==="/deptUpdate.do"&&req.method==="GET"){
            let deptno=Number(params.deptno);
            if (Number.isNaN(deptno)){
                errMsg();
                return;
            }
            let sql="SELECT * FROM DEPT WHERE DEPTNO=?";
            const [rows,fields]=await pool.query(sql,[deptno]);
            const html=pug.renderFile("./templates/deptUpdate.pug",{dept:rows[0]});
            res.write(html);
            res.end();
        }else if(urlObj.pathname==="/deptUpdate.do"&&req.method==="POST"){
            let postQuery="";
            let update=0;
            req.on("data",(p)=>{
                postQuery+=p;
            });
            req.on("end",async ()=>{
                const postPs=  querystring.parse(postQuery);
                try{
                    let sql=`UPDATE DEPT SET DEPTNO=?, DNAME=?,LOC=? WHERE DEPTNO=?`
                    const [result]=await pool.execute(sql,[postPs.newDeptno,postPs.dname,postPs.loc,postPs.deptno]);

                    update=result.affectedRows;
                }catch (e) {
                    console.error(e);aa
                }
                Success(update,"/deptDetail.do?deptno="+postPs.deptno,"/deptUpdate.do?deptno="+postPs.deptno)

            });
        }else if(urlObj.pathname==="/deptDelete.do"){
            let deptno=Number(params.deptno);

            let sql="DELETE FROM DEPT WHERE DEPTNO=?";
            let del=0;

            try {
                const [result]=await pool.execute(sql,[deptno]);

                del=result.affectedRows;
            }catch (e) {
                console.error(e)
            }
            Success(del,"/deptList.do","/deptUpdate.do?deptno="+params.deptno)

        }else if(urlObj.pathname==="/deptInsert.do"&&req.method==="GET"){
            const html=pug.renderFile("./templates/deptInsert.pug");
            res.write(html);
            res.end();
        }else if (urlObj.pathname==="/deptInsert.do"&&req.method==="POST"){
            let postQuery="";
            req.on("data",(p)=>{postQuery+=p});
            req.on("end",async ()=>{
                const postPs=querystring.parse(postQuery);
                for(let key in postPs){
                    if(postPs[key].trim()==="")postPs[key]=null;
                }
                let sql=`INSERT INTO DEPT(DEPTNO, DNAME, LOC) VALUE (?,?,?)`;

                let insert=0;
                try {
                    const [result]=await pool.execute(sql,[postPs.deptno,postPs.dname,postPs.loc]);
                    insert=result.affectedRows;
                }catch (e) {
                    console.error(e);
                }
                Success(insert,"/deptList.do","/deptInsert.do")
            })
        }
    }
    function Success(sum,a,b){
        if(sum>0){
            res.writeHead(302,{location:a});
            res.end();
        }else{
            res.writeHead(302,{location:b});
            res.end();
        }
    }
    function errMsg(){
        res.statusCode=400;
        res.write("<h1>꼭필요한 파라미터를 보내지 않았습니다. 400오류</h1>");
        res.end();
    }

})