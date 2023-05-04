//window.onload : 브라우저 document 를 모두 load 한 시점
window.onload=function (e){
    const  empInsertForm=document.forms["empInsertFrom"];
    console.log(empInsertForm) //스크립트가 dom node 생성보다 먼저 실행되서
}//node 에 이벤트의 콜백함수를 직접정의하면 마지막 콜백함수만 실행된다.

window.addEventListener("load",(e)=>{
    console.log("addEventListener 로 정의한 콜백함수")
})

//document.DOMContentLoaded : 브라우저가 document 를 모두 load 한 시점(addEventListener 로만 작성 가능)
document.addEventListener("DOMContentLoaded",(e)=>{
    console.log("DOMContentLoaded 로 정의한 콜백 함수")
})
//항의 !! 콜백함수에 정의하는 것 너무너무 보기 싫고 코드도 복잡하다 !!
//script 에 defer(boolean) 라는 속성을 제공 : DOMContentLoaded 시점까지 기다렸다가 script 문서를 실행!

const empInsertForm=document.forms["empInsertForm"];
console.log(empInsertForm);
// empInsertForm.mgr.onchange=async function (e){
//     let val=this.value;
//     console.log(val)
//     let url="/empnoCheck.do?empno="+val;
//     console.log("url"+url)
//     const res=await fetch(url);
//     if(res.status==200){
//         const obj= await res.json();
//         if(val==obj.emp.MGR){
//             mgrMsg.innerText=obj.emp.ENAME+"상사님이 있습니다."
//         }
//     }
// }
empInsertForm.mgr.onchange=mgrCheck;
empInsertForm.deptno.onchange=deptnoCheck;
empInsertForm.empno.onchange=empnoCheck;
empInsertForm.ename.onchange=enameCheck;
empInsertForm.job.onchange=jobCheck;
empInsertForm.sal.onchange=salCheck;
empInsertForm.comm.onchange=commCheck;
async function empnoCheck(e){
    //AJAX (XMLHttpRequest,fetch)
    let val=empInsertForm.empno.value;

    const parentNode=(empInsertForm.empno.closest(".inputCont"));
    if(val.length<4  && !isNaN(val)){
        empnoMsg.innerText="세글자 이상의 수만 입력 가능합니다."
        parentNode.classList.add("error");
        parentNode.classList.remove("success");
        return false;
    }

    let url="/empnoCheck.do?empno="+val;
    const res=await fetch(url); //.then((res)=>{return res.json()})
    if(res.status==200){
        const obj=await res.json(); //.then((obj)=>{...})
        //console.log(obj)
        if(obj.checkId){
            empnoMsg.innerText=obj.emp.ENAME+"님이 사용 중인 사번입니다."
            parentNode.classList.add("error");
            parentNode.classList.remove("success");

        }else{
            empnoMsg.innerText="사용 가능한 사번입니다."
            parentNode.classList.add("success");
            parentNode.classList.remove("error");
            return true;
        }
    }else if(res.status==400){
        this.value="";
        alert("정수만 입력하세요!");
    }else {
        alert(res.status+" 오류입니다. 다시 시도!");
    }
}
function enameCheck(e){

    const  parentNode=empInsertForm.ename.closest(".inputCont");//찾는부모에 가장근접한
    if (empInsertForm.ename.value.length<2){
        enameMsg.innerText="이름은 2글자 이상 입력하세요!"
        parentNode.classList.add("error!");
        parentNode.classList.remove("success");
        return false;
    }else{enameMsg.innerText=""
        parentNode.classList.add("success!");
        parentNode.classList.remove("error");
        return true;
    }
}

function jobCheck(e){

    const  parentNode=empInsertForm.job.closest(".inputCont");//찾는부모에 가장근접한
    if (empInsertForm.job.value.length<2){
        jobMsg.innerText="이름은 2글자 이상 입력하세요!"
        parentNode.classList.add("error!");
        parentNode.classList.remove("success");
        return false;
    }else{jobMsg.innerText=""
        parentNode.classList.add("success!");
        parentNode.classList.remove("error");
        return true;
    }
}

function salCheck(){
    let val=empInsertForm.sal.value;
    const parentNode=empInsertForm.sal.closest(".inputCont");
    //val.trim() 공백이 아닐때
    //isNaN : """ => 0 바꾸면서 수가 가능!
    if(val.trim() && !isNaN(val)){
        salMsg.innerText=""
        parentNode.classList.add("success");
        parentNode.classList.remove("error");
        return true;
    }else{
        salMsg.innerText="급여는 수만 입력 가능합니다."
        parentNode.classList.add("error");
        parentNode.classList.remove("success");
        return false;
    }

}
function commCheck(){
    let val=empInsertForm.comm.value;
    const parentNode=empInsertForm.comm.closest(".inputCont");
    //val.trim() 공백이 아닐때
    //isNaN : """ => 0 바꾸면서 수가 가능!
    if(!val){
        commMsg.innerText="상여급이 null 처리 됩니다."
        return true;
    }
    if(val.trim() && !isNaN(val)){
        commMsg.innerText=""
        parentNode.classList.add("success");
        parentNode.classList.remove("error");
        return true;
    }else{
        commMsg.innerText="상여급은 수만 입력 가능합니다."
        parentNode.classList.add("error");
        parentNode.classList.remove("success");
        return false;
    }
}

async function mgrCheck(e){
    let val=empInsertForm.mgr.value;
    if(val===""){
        mgrMsg.innerText="상사가 null 처리 됩니다."
        return true;
    }
    let url="/empnoCheck.do?empno="+val;
    const res=await fetch(url);//.then((res)=>{})
    console.log(res)
    if(res.status==200) {
        const obj = await res.json(); //.then((obj)=>{....});
        console.log(obj)
        // console.log(obj)
        if(obj.checkId){
            mgrMsg.style.color="lightgreen";
            mgrMsg.innerText=" 상사는"+obj.emp.ENAME+"님 입니다.";

            return true;
        }else {
            mgrMsg.style.color="red";
            mgrMsg.innerText="상사가 존재하지 않습니다."
        }
    }else if(res.status==400){
        this.value="";
        alert("상사번호를 입력하거나 정수만 입력하세요.")
    }else{
        alert(res.status+"오류입니다.다시시도 !");
    }


}



    async function deptnoCheck(e){
    //AJAX (XMLHttpRequest,fetch)
    let val=empInsertForm.deptno.value;
    if(!val){
        deptnoMsg.innerText="부서가 null 처리 됩니다."
        return true;
    }
    let url="/deptCheck.do?empno="+val;
    const res=await fetch(url);//.then((res)=>{})
    console.log(res)
    if(res.status==200) {
        const obj = await res.json(); //.then((obj)=>{....});
        console.log(obj)
        // console.log(obj)
        if(obj.checkId){
            deptnoMsg.style.color="lightgreen";
            deptnoMsg.innerText="해당 부서는 "+obj.dept.DNAME+"이고,근무지는"+obj.dept.LOC+"입니다.";
            return true;
        }else {
            deptnoMsg.style.color="red";
            deptnoMsg.innerText="없는 부서 번호 입니다."
        }
    }else if(res.status==400){
        this.value="";
        alert("부서번호를 입력하거나 정수만 입력하세요.")
    }else{
        alert(res.status+"오류입니다.다시시도 !");
    }
}

//form submit 버튼을 누르면 form.onsubmit() 이벤트가 발생하면서
//form 양식(input)에 작성한 내역을 액션에 작성한 동적페이지에 제출!!
//유효성검사 : 액션페이지에서 처리하지 못하는 값을 미리 검출하고 경고하는 일!
//1.양식제출을 막아야한다!
empInsertForm.onsubmit=async (e)=>{
    e.preventDefault();//이벤트를 막는다!
    //astnc 함수에서 반환하는 값은 무조건 프라미스화가 된다.
    //return true => return new Promise((resolve)=>{resolve(true)}
    let empnoState=await empnoCheck();
    let mgrState=await mgrCheck();
    let deptnoState=await deptnoCheck();
    let enameState=enameCheck();
    let jobState=jobCheck();
    let salState=salCheck();
    let commState=commCheck();

    console.log(empnoState,mgrState,deptnoState)
    if(empnoState && mgrState && deptnoState && enameState && jobState && salState && commState){
        empInsertForm.submit();
    }
    // empInsertForm.submit(); //만족하면 제출
}