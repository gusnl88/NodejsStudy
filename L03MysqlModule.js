const http=require("http2");
const url=require("url");  //nodejs 에서 제공하는 기본 모듈
const queryStr=require("querystring");
const mysql=require("mysql");
const mysqlConnInfo={
    host: "localhost",
    port:3306,
    database:"SCOTT",
    user: "root",
    password:"mysql123",
}


http.createServer((req, resp)=>{

    console.log(req.url);
   const urlObj= url.parse(req.url);
    console.log(urlObj)
    resp.setHeader("content-type","text/html;charset=UTF-8")
    if(urlObj.pathname=="/"){
        resp.write("<h1>url 모듈과 mysql 사용해 보기</h1>")
        resp.write(`<p>
                    <a href="power.do?a=3&b=6">파라미터 a,b 로 거듭제곱한 결과물을 반환하는 동적페이지</a>
                    </p>`);
        resp.write(`<p>
                    <a href="deptList.do">부서리스트</a>
                    </p>`);
        resp.end();
    }else if(urlObj.pathname=="/power.do"){
       const params= queryStr.parse(urlObj.query);
        console.log(params);
        resp.write("<h1>a b 파라미터를 거듭제곱 하는 동적 페이지</h1>")
        resp.write(`<h2>${params.a} 거듭제곱 ${params.b} = ${Math.pow(params.a,params.b)}</h2>`)
        resp.end();
    }else if(urlObj.pathname=="/deptList.do"){
        resp.write("<h1>부서리스트 동적페이지(mysql 모듈 사용)</h1>")

        try {
            const conn=mysql.createConnection(mysqlConnInfo);
            conn.query("SELECT * FROM DEPT",(err,rows,fields)=>{
                if(err) console.error(err);
                let html=`<table><tr><th>번호</th><th>이름</th><th>위치</th></tr>`
                rows.forEach((row)=>{
                    html+= `<tr>
                        <td>${row.DEPTNO}</td>
                        <td>${row["DENAME"]}</td>
                        <td>${row["LOC"]}</td>
                    </tr>`;
                })
                html+=`</table>`;
                resp.write(html);
                console.log(rows)
            });//("실핼할 질의",()=>{쿼리가 실행되고 값이 반환되면 실행되는 콜백함수})
        }catch (e){
            console.error(e);
        }
        // resp.end();
    }

    else{
        resp.write("<h1>404 없는 주소입니다.</h1>")
        resp.end();
    }
}).listen(7070);