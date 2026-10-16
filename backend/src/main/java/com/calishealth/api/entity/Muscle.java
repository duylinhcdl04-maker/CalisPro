package com.calishealth.api.entity;

import jakarta.persistence.*;

@Entity @Table(name = "muscles")
public class Muscle {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(nullable = false, unique = true, length = 50) private String code;
 @Column(nullable = false, length = 100) private String name;
 @Column(name = "name_vi", length = 100) private String nameVi;
 @Column(name = "body_region", length = 50) private String bodyRegion;
 // FRONT / BACK / BOTH: mặt hiển thị trên sơ đồ giải phẫu
 @Column(length = 10) private String side;

 public Long getId(){return id;}
 public String getCode(){return code;} public void setCode(String v){code=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public String getNameVi(){return nameVi;} public void setNameVi(String v){nameVi=v;}
 public String getBodyRegion(){return bodyRegion;} public void setBodyRegion(String v){bodyRegion=v;}
 public String getSide(){return side;} public void setSide(String v){side=v;}
}
