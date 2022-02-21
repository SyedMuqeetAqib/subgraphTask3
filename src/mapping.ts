import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  PhoenixDAO,
  Approval,
  OwnershipTransferred,
  Transfer
} from "../generated/PhoenixDAO/PhoenixDAO"
import { TokenDetail, TransactionHistory,  User } from "../generated/schema"

export function handleApproval(event: Approval): void {
  let transaction = new TransactionHistory(event.transaction.hash.toHex());
  transaction.to = event.params.owner;
  transaction.from = event.params.spender;
  transaction.method = "approve";
  transaction.amount = event.params.value;
  transaction.save()

  let id = event.params.spender.toHexString();
  let user = User.load(id);
  if(!user){
    user = new User(id);
    user.address = event.params.spender;
    user.currentBalance = BigInt.fromI32(0);
  }
  user.allowance = event.params.value;
  user.save()

}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  let transaction = new TransactionHistory(event.transaction.hash.toHex());
  transaction.to = event.params.newOwner;
  transaction.from = event.params.previousOwner;
  transaction.amount = BigInt.fromI32(0);
  transaction.method = "ownershipTransfer";
  transaction.time = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.save()
}

export function handleTransfer(event: Transfer): void {
  let transaction = new TransactionHistory(event.transaction.hash.toHex());
  transaction.to = event.params.to;
  transaction.from = event.params.from;
  transaction.method = "transferToken";
  transaction.amount = event.params.value;
  transaction.time = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.save();
  let tokenDetails = TokenDetail.load(Address.fromString("0x38A2fDc11f526Ddd5a607C1F251C065f40fBF2f7").toHexString());
if(!tokenDetails){
  tokenDetails = new TokenDetail(Address.fromString("0x38A2fDc11f526Ddd5a607C1F251C065f40fBF2f7").toHexString())
  tokenDetails.tokenMaxSupply = BigInt.fromI32(110000000);
  tokenDetails.holders = [];
}
let holders = tokenDetails.holders;
 let senderUser = User.load((event.params.from).toHexString());
 if(senderUser){
    senderUser.currentBalance = senderUser.currentBalance.minus(event.params.value)
    if(holders.includes(senderUser.address.toHexString())){
      if(senderUser.currentBalance.minus(event.params.value) === BigInt.fromI64(0)){
        const index = holders.indexOf(senderUser.address.toHexString());
              if(index > -1){
                holders.splice(index,1)
                tokenDetails.holders = holders;
              }
      }
    }else{
      if(senderUser.currentBalance.minus(event.params.value) !== BigInt.fromI64(0)){
     holders.push(event.params.from.toHexString());
     tokenDetails.holders = holders;
      }
    }

    senderUser.save();
 }
 else{
  senderUser = new User(event.params.from.toHexString());
  senderUser.address = event.params.from;
  senderUser.currentBalance = senderUser.currentBalance;
  senderUser.allowance = event.params.value;
  senderUser.save()
 }

  let receiverUser = User.load((event.params.to).toHexString());
  if(receiverUser){
    receiverUser.currentBalance = receiverUser.currentBalance.plus(event.params.value)
    if(holders.includes(receiverUser.address.toHexString())){
      if(receiverUser.currentBalance.minus(event.params.value) == BigInt.fromI64(0)){
        const index = holders.indexOf(receiverUser.address.toHexString());
              if(index > -1){
                holders.splice(index,1)
                tokenDetails.holders = holders;
              }
      }
    }else{
      if(receiverUser.currentBalance.minus(event.params.value) != BigInt.fromI64(0)){
     holders.push(event.params.to.toHexString());
     tokenDetails.holders = holders;
      }
    }
    receiverUser.save();
 }
 else{
   receiverUser = new User(event.params.to.toHexString());
   receiverUser.address = event.params.to;
   receiverUser.currentBalance = receiverUser.currentBalance.plus(event.params.value);
   receiverUser.allowance = event.params.value;
   receiverUser.save()
 }
 tokenDetails.save()
}
