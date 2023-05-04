const http=require("http");
const url=require("url");
const  querystring=require("querystring");
const fs=require("fs/promises");
const mysql=require("mysql");
const mysql2=require("mysql2/promise");//mysql 을 프라미스화한 라이브러리.
const pug=require("pug");

const mysqlConnInfo={
    host: "localhost",
    port:3306,
    database:"SCOTT",
    user: "root",
    password:"mysql123",
}

const server=http.createServer();
server.listen(8888,()=>{
    console.log("http://localhost:8888 에 서버가 열림");
})
server.on("request",async (req,res)=>{

    const urlObj=url.parse(req.url);
    const params=querystring.parse(urlObj.query);     //이건뭐..공식..
    if(urlObj.pathname==="/"){
       let data= await fs.readFile("L05Index.html");
       res.write(data);
        res.end();
    }else if(urlObj.pathname==="/deptListModel1.do"){
        try {
            const conn=mysql.createConnection(mysqlConnInfo);
            conn.query("SELECT * FROM DEPT",(err,rows)=>{
                if(err) console.error(err);
                let html="<table>";
                html+="<thead><tr><td>부서번호</td><td>부서이름</td><td>부서위치</td></tr></thead>"
                for(const low of rows){
                    html+="<tr>";
                    html+="<td>"+low["DEPTNO"]+"</td>"
                    html+="<td>"+low["DNAME"]+"</td>"
                    html+="<td>"+low["LOC"]+"</td>"
                    html+="</tr>";
                }
                html+="</table>"
                res.write(html);
                res.end();
            });
        }catch (err){

            console.error(err);
        }


        res.setHeader("content-type","text/html;charset=utf-8;")
        res.write("<h1>model1 은 한 페이지를(dba,backend,frontend) 3명의 개발자가 다 같이 작업합니다. 지옥!</h1>");
        res.write("<h2>동적페이지에서 html 을 렌더하면 프로트엔드 개발자가 회사를 그만둘 수 있다~</h2>")

    }else if(urlObj.pathname==="/deptList.do"){
        let data=await fs.readFile("L05DeptList.html");
        let conn=await mysql2.createConnection(mysqlConnInfo);
        let [rows,fields]=await conn.query("SELECT * FROM DEPT");//fields 테이블 구조 (desc dept 랑 비슷)
        res.write(`<script>const deptList=${JSON.stringify(rows)};</script>`);
        res.write(data);
        // res.write("const deptList="+JSON.stringify(rows)+";");//Object 를 json 으로 변환
        res.end();
    }else if(urlObj.pathname==="/deptListPug.do"){//node(pug),express(pug),톰캣(jsp),spring(thymeleaf)
          try {
              const conn=await mysql2.createConnection(mysqlConnInfo);
              const [rows,fields]=await conn.query("SELECT * FROM DEPT");
              let html= pug.renderFile("L05DeptList.pug",{deptList:rows});
              //pug 문서에서 html 을 렌더링할때 Object 를 참조할 수 있다.(서버사이드 렌더!)
              res.write(html);
              res.end();
          }catch (e){
              console.error(e)
              res.statusCode=500;

              res.write("<h1>db나 렌더링에서 오류가 발생했습니다. 다시시도 500</h2>");
              res.end();
          }

    }else if(urlObj.pathname==="/empListPug.do"){
        const conn=await mysql2.createConnection(mysqlConnInfo);
        const [rows,fields]=await conn.query("SELECT *,DATE_FORMAT(HIREDATE,'%Y년-%m월-%d일') HIREDATE FROM EMP")
        res.write(`<script>const empList=${JSON.stringify(rows)};</script>`)

        let html=pug.renderFile("L05EmpList.pug",{empList:rows});

        res.write(html);
        res.end();
    }else if(urlObj.pathname==="/L05EmpDetail.do"){
        const conn=await mysql2.createConnection(mysqlConnInfo);
        const [rows,fields]=await conn.query("SELECT * FROM EMP WHERE EMPNO=?",[params.empno])
        // res.write(`<script>const empD=${JSON.stringify(rows)}</script>`)
        let html=pug.renderFile("L05EmpDetail.pug",{empD:rows[0]});
        res.write(html);
        res.end();
    }
    else{
        res.setHeader("content-type","text/html;charset=utf-8;")
        res.statusCode=404;
        res.write("<h1>존재하지 않는 리소스 입니다.</h1>");
        res.end();
    }

})