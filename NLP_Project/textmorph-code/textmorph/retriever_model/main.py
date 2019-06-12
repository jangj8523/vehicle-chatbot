import click

from gtd.utils import Config
from textmorph.retriever_model.training_run import RetrieverTrainingRuns


@click.command()
@click.argument('config_path')
@click.option('--config_string', '-s', help='Custom config passed as a string.')
@click.option('--name', '-n', help='Name of the training run.', default='unnamed')
def run(config_path, config_string, name):
    runs = RetrieverTrainingRuns(check_commit=False)
    config = Config.from_file(config_path)
    if config_string:
        config = Config.merge([config, Config.from_str(config_string)])
    run = runs.new(config, name)
    run.train()


if __name__ == '__main__':
    run()