import React, { Component } from 'react';
import { Query } from "react-apollo";
import gql from "graphql-tag";
import AddWord from "../Main/AddWord";

const GET_WORDCHAIN = gql`

query WordChain($id: String!){
    wordChain(id: $id){
        _id
        lastLetter
        lastIndex
        words{
            value
        }
    }
  }
`;
const WORD_ADDED = gql`

subscription WordAdded($chainId: String!){
    wordAdded(wordChainId: $chainId){
        value
    }
  }
`;
class WordChainRoom extends Component {


    render() {
        return (<Query query={GET_WORDCHAIN} variables={{ id: this.props.chainId }}>
            {({ loading, error, data, subscribeToMore }) => {
                if (loading) return "Loading...";
                if (error) return `Error! ${error.message}`;
                const chain = data.wordChain;
                return (
                    <div>
                        <div>{chain._id}</div>
                        <div>Last letter: {chain.lastLetter}</div>
                        {chain.words.map((word) => (
                            <li>{word.value}</li>
                        ))}
                        <WordList words={chain.words} subscribeToMore={subscribeToMore}></WordList>
                        <div>
                            <AddWord chainId="5c45251dd3a4aef95e136f32" userId="5c45250ed3a4aef95e136f31"></AddWord>
                        </div>
                    </div>
                );
            }}
        </Query>);
    }
};

class WordList extends Component {

    componentDidMount() {
        this.props.subscribeToMore({
            document: WORD_ADDED,
            variables: { chainId: "5c45251dd3a4aef95e136f32" },
            updateQuery: (prev, { subscriptionData }) => {
                console.log(subscriptionData);
                if (!subscriptionData.data) return prev;

                return Object.assign({},prev.wordChain,{
                    wordChain:{
                        ...prev.wordChain,
                        words: [...prev.wordChain.words, subscriptionData.data.wordAdded]
                    }
                });
            }
        })
    }
    render() {
        return (
            <div>
                {this.props.words.map((word) => (
                    <li>{word.value}</li>
                ))}
            </div>
        );
    }
}

export default WordChainRoom;