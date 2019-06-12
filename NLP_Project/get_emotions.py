

import math
import sys
import os.path
import numpy as np
import argparse
import pandas as pd
import collections
from nltk.sentiment.vader import SentimentIntensityAnalyzer

STEP_LABEL = "===== STEP"
TRAIN_LABEL = "=== train"
VALID_LABEL = "=== valid"

SOURCE = "SOURCE: "
TARGET = "TARGET: "

TRANSFORM_PREFIX = ") "

sentence_mapping = {}
iteration_results = {}


"""
sentence_mapping[('train', 'num_iterations', 'source')] = {"target" : target, "options ": [option1, option2, option3...]}
iteration_results[('train', 'iterations')] = {'loss': loss, 'bleu' : bleu}
emotion_mapping[('train', 'num_iterations', 'source')] = {"positive" : option1, "negative" : option2}

"""

def computeLoss():
    f = open(os.getcwd() + "/stdout.txt", "r")
    for line in f:
        sentence = line[:-1]
        if STEP_LABEL in sentence:
            iteration_num = int(line.split(' ')[2])
            find_loss(f, iteration_num)

def find_loss(f, iteration_num):
    iterations = iteration_num
    phase = "train"
    for line in f:
        sentence = line[:-1]

def generate_emotional_sentences(emotion_mapping):
    sid = SentimentIntensityAnalyzer()
    for phase, num_iterations, source in sentence_mapping.keys():
        optionList = sentence_mapping[(phase, num_iterations, source)]["options"]
        positive_score = 0
        negative_score = 0
        output_map = {"positive": None, "negative": None, "target": sentence_mapping[(phase, num_iterations, source)]["target"], "options" : []}
        # if sid.polarity_scores(source)['neu'] > 0.9:
        #     print (source)
        for options in optionList:
            score = sid.polarity_scores(options)
            neg_score = score['neg']
            pos_score = score['pos']
            neu_score = score['neu']
            if pos_score > positive_score and pos_score > neg_score:
                output_map["positive"] = options
                positive_score = pos_score
            elif neg_score > negative_score and neg_score > pos_score:
                 output_map["negative"] = options
                 negative_score = neg_score
            output_map["options"].append(options)
        emotion_mapping[(phase, num_iterations, source)] = output_map


def find_mapping(f, iteration_num):
    iterations = iteration_num
    phase = "train"
    valid_bleu_score = []
    collect = False
    for line in f:
        sentence = line[:-1]
        if STEP_LABEL in sentence:
            iterations = int(line.split(' ')[2])
            continue
        if TRAIN_LABEL in sentence:
            phase = "train"
            continue
        if VALID_LABEL in sentence:
            phase = "valid"
            continue
        if "loss" in sentence and "bleu" in sentence:
            temp = sentence.split(',')
            loss = float(temp[0].split(' ')[1])
            bleu = float(temp[1].split(' ')[2])
            iteration_results[(phase, iterations)] = {'loss' : loss, 'bleu' : bleu}
            print ("Iteration: ", iterations)
            print ("Phase: ", phase)
            print (iteration_results[(phase, iterations)])
            print ('')
        elif "SOURCE: " in sentence:
            source = sentence.split("SOURCE: ")[1]
            sentence_mapping[(phase, iterations, source)] = {}
        elif "INSERT: " in sentence or "DELETE: " in sentence:
            continue
        elif "TARGET: " in sentence:
            target = sentence.split("TARGET: ")[1]
            sentence_mapping[(phase, iterations, source)] = {"target": target}
            sentence_mapping[(phase, iterations, source)]["options"] = []
        elif ") " in sentence:
            options = sentence[7:]
            sentence_mapping[(phase, iterations, source)]["options"].append(options)

    print ("=== TRAIN ====")
    for i in range(500, 400000, 1000):
        print (str(iteration_results[('train', i)]['loss']) + ',')
    print ("=== VALID ====")
    for i in range(500, 400000, 1000):
        print (str(iteration_results[('valid', i)]['loss']) + ',')


def parse_stdout():
    f = open(os.getcwd() + "/stdout.txt", "r")
    for line in f:
        sentence = line[:-1]
        if STEP_LABEL in sentence:
            iteration_num = int(line.split(' ')[2])
            find_mapping(f, iteration_num)

def get_emotional_mapping():
    emotion_mapping = {}
    parse_stdout()
    generate_emotional_sentences(emotion_mapping)
    return emotion_mapping

def main():
    val = sum([0.42310625, 0.394721875, 0.46108125, 0.428503125, 0.3841875, 0.33335625, 0.309078125, 0.387884375, 0.44544375, 0.35439375])
    print (float(val)/10)
    # emotion = get_emotional_mapping()


if __name__ == '__main__':
    main()
